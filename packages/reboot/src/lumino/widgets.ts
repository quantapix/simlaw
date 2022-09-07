/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-empty-function */
import { ArrayExt, find, max, StringExt } from "./algorithm.js"
import { AttachedProperty } from "./properties.js"
import { CommandRegistry } from "./commands.js"
import {
  DisposableDelegate,
  IDisposable,
  IObservableDisposable,
} from "./disposable.js"
import { Drag } from "./dragdrop.js"
import { ElementExt, Platform, Selector } from "./domutils.js"
import { getKeyboardLayout } from "./keyboard.js"
import { ISignal, Signal } from "./signaling.js"
import { JSONExt, ReadonlyJSONObject, MimeData } from "./utils.js"
import {
  ConflatableMessage,
  IMessageHandler,
  Message,
  MessageLoop,
} from "./messaging.js"
import {
  ARIAAttrNames,
  ElementARIAAttrs,
  ElementDataset,
  ElementInlineStyle,
  h,
  VirtualDOM,
  VirtualElement,
} from "./virtualdom.js"

export class AccordionLayout extends SplitLayout {
  constructor(options: AccordionLayout.IOptions) {
    super({ ...options, orientation: options.orientation || "vertical" })
    this.titleSpace = options.titleSpace || 22
  }
  get titleSpace(): number {
    return this.widgetOffset
  }
  set titleSpace(value: number) {
    value = Utils.clampDimension(value)
    if (this.widgetOffset === value) {
      return
    }
    this.widgetOffset = value
    if (!this.parent) {
      return
    }
    this.parent.fit()
  }
  get titles(): ReadonlyArray<HTMLElement> {
    return this._titles
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    this._titles.length = 0
    super.dispose()
  }
  readonly renderer: AccordionLayout.IRenderer
  public updateTitle(index: number, widget: Widget): void {
    const oldTitle = this._titles[index]
    const expanded = oldTitle.classList.contains("lm-mod-expanded")
    const newTitle = Private.createTitle(this.renderer, widget.title, expanded)
    this._titles[index] = newTitle
    this.parent!.node.replaceChild(newTitle, oldTitle)
  }
  protected attachWidget(index: number, widget: Widget): void {
    const title = Private.createTitle(this.renderer, widget.title)
    ArrayExt.insert(this._titles, index, title)
    this.parent!.node.appendChild(title)
    widget.node.setAttribute("role", "region")
    widget.node.setAttribute("aria-labelledby", title.id)
    super.attachWidget(index, widget)
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    ArrayExt.move(this._titles, fromIndex, toIndex)
    super.moveWidget(fromIndex, toIndex, widget)
  }
  protected detachWidget(index: number, widget: Widget): void {
    const title = ArrayExt.removeAt(this._titles, index)
    this.parent!.node.removeChild(title!)
    super.detachWidget(index, widget)
  }
  protected updateItemPosition(
    i: number,
    isHorizontal: boolean,
    left: number,
    top: number,
    height: number,
    width: number,
    size: number
  ): void {
    const titleStyle = this._titles[i].style
    titleStyle.top = `${top}px`
    titleStyle.left = `${left}px`
    titleStyle.height = `${this.widgetOffset}px`
    if (isHorizontal) {
      titleStyle.width = `${height}px`
    } else {
      titleStyle.width = `${width}px`
    }
    super.updateItemPosition(i, isHorizontal, left, top, height, width, size)
  }
  private _titles: HTMLElement[] = []
}
export namespace AccordionLayout {
  export type Orientation = SplitLayout.Orientation
  export type Alignment = SplitLayout.Alignment
  export interface IOptions extends SplitLayout.IOptions {
    renderer: IRenderer
    titleSpace?: number
  }
  export interface IRenderer extends SplitLayout.IRenderer {
    readonly titleClassName: string
    createSectionTitle(title: Title<Widget>): HTMLElement
  }
}
namespace Private {
  export function createTitle(
    renderer: AccordionLayout.IRenderer,
    data: Title<Widget>,
    expanded: boolean = true
  ): HTMLElement {
    const title = renderer.createSectionTitle(data)
    title.style.position = "absolute"
    title.setAttribute("aria-label", `${data.label} Section`)
    title.setAttribute("aria-expanded", expanded ? "true" : "false")
    title.setAttribute("aria-controls", data.owner.id)
    if (expanded) {
      title.classList.add("lm-mod-expanded")
    }
    return title
  }
}
export class AccordionPanel extends SplitPanel {
  constructor(options: AccordionPanel.IOptions = {}) {
    super({ ...options, layout: Private.createLayout(options) })
    this.addClass("lm-AccordionPanel")
  }
  get renderer(): AccordionPanel.IRenderer {
    return (this.layout as AccordionLayout).renderer
  }
  get titleSpace(): number {
    return (this.layout as AccordionLayout).titleSpace
  }
  set titleSpace(value: number) {
    ;(this.layout as AccordionLayout).titleSpace = value
  }
  get titles(): ReadonlyArray<HTMLElement> {
    return (this.layout as AccordionLayout).titles
  }
  addWidget(widget: Widget): void {
    super.addWidget(widget)
    widget.title.changed.connect(this._onTitleChanged, this)
  }
  collapse(index: number): void {
    const widget = (this.layout as AccordionLayout).widgets[index]
    if (widget && !widget.isHidden) {
      this._toggleExpansion(index)
    }
  }
  expand(index: number): void {
    const widget = (this.layout as AccordionLayout).widgets[index]
    if (widget && widget.isHidden) {
      this._toggleExpansion(index)
    }
  }
  insertWidget(index: number, widget: Widget): void {
    super.insertWidget(index, widget)
    widget.title.changed.connect(this._onTitleChanged, this)
  }
  handleEvent(event: Event): void {
    super.handleEvent(event)
    switch (event.type) {
      case "click":
        this._evtClick(event as MouseEvent)
        break
      case "keydown":
        this._eventKeyDown(event as KeyboardEvent)
        break
    }
  }
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener("click", this)
    this.node.addEventListener("keydown", this)
    super.onBeforeAttach(msg)
  }
  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg)
    this.node.removeEventListener("click", this)
    this.node.removeEventListener("keydown", this)
  }
  private _onTitleChanged(sender: Title<Widget>): void {
    const index = ArrayExt.findFirstIndex(this.widgets, widget => {
      return widget.contains(sender.owner)
    })
    if (index >= 0) {
      ;(this.layout as AccordionLayout).updateTitle(index, sender.owner)
      this.update()
    }
  }
  private _computeWidgetSize(index: number): number[] | undefined {
    const layout = this.layout as AccordionLayout
    const widget = layout.widgets[index]
    if (!widget) {
      return undefined
    }
    const isHidden = widget.isHidden
    const widgetSizes = layout.absoluteSizes()
    const delta = (isHidden ? -1 : 1) * this.spacing
    const totalSize = widgetSizes.reduce(
      (prev: number, curr: number) => prev + curr
    )
    const newSize = [...widgetSizes]
    if (!isHidden) {
      const currentSize = widgetSizes[index]
      this._widgetSizesCache.set(widget, currentSize)
      newSize[index] = 0
      const widgetToCollapse = newSize.map(sz => sz > 0).lastIndexOf(true)
      if (widgetToCollapse === -1) {
        return undefined
      }
      newSize[widgetToCollapse] =
        widgetSizes[widgetToCollapse] + currentSize + delta
    } else {
      const previousSize = this._widgetSizesCache.get(widget)
      if (!previousSize) {
        return undefined
      }
      newSize[index] += previousSize
      const widgetToCollapse = newSize
        .map(sz => sz - previousSize > 0)
        .lastIndexOf(true)
      if (widgetToCollapse === -1) {
        newSize.forEach((_, idx) => {
          if (idx !== index) {
            newSize[idx] -=
              (widgetSizes[idx] / totalSize) * (previousSize - delta)
          }
        })
      } else {
        newSize[widgetToCollapse] -= previousSize - delta
      }
    }
    return newSize.map(sz => sz / (totalSize + delta))
  }
  private _evtClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null
    if (target) {
      const index = ArrayExt.findFirstIndex(this.titles, title => {
        return title.contains(target)
      })
      if (index >= 0) {
        event.preventDefault()
        event.stopPropagation()
        this._toggleExpansion(index)
      }
    }
  }
  private _eventKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented) {
      return
    }
    const target = event.target as HTMLElement | null
    let handled = false
    if (target) {
      const index = ArrayExt.findFirstIndex(this.titles, title => {
        return title.contains(target)
      })
      if (index >= 0) {
        const keyCode = event.keyCode.toString()
        if (event.key.match(/Space|Enter/) || keyCode.match(/13|32/)) {
          target.click()
          handled = true
        } else if (
          this.orientation === "horizontal"
            ? event.key.match(/ArrowLeft|ArrowRight/) || keyCode.match(/37|39/)
            : event.key.match(/ArrowUp|ArrowDown/) || keyCode.match(/38|40/)
        ) {
          const direction =
            event.key.match(/ArrowLeft|ArrowUp/) || keyCode.match(/37|38/)
              ? -1
              : 1
          const length = this.titles.length
          const newIndex = (index + length + direction) % length
          this.titles[newIndex].focus()
          handled = true
        } else if (event.key === "End" || keyCode === "35") {
          this.titles[this.titles.length - 1].focus()
          handled = true
        } else if (event.key === "Home" || keyCode === "36") {
          this.titles[0].focus()
          handled = true
        }
      }
      if (handled) {
        event.preventDefault()
      }
    }
  }
  private _toggleExpansion(index: number) {
    const title = this.titles[index]
    const widget = (this.layout as AccordionLayout).widgets[index]
    const newSize = this._computeWidgetSize(index)
    if (newSize) {
      this.setRelativeSizes(newSize, false)
    }
    if (widget.isHidden) {
      title.classList.add("lm-mod-expanded")
      title.setAttribute("aria-expanded", "true")
      widget.show()
    } else {
      title.classList.remove("lm-mod-expanded")
      title.setAttribute("aria-expanded", "false")
      widget.hide()
    }
  }
  private _widgetSizesCache: WeakMap<Widget, number> = new WeakMap()
}
export namespace AccordionPanel {
  export type Orientation = SplitLayout.Orientation
  export type Alignment = SplitLayout.Alignment
  export type IRenderer = AccordionLayout.IRenderer
  export interface IOptions extends Partial<AccordionLayout.IOptions> {
    layout?: AccordionLayout
  }
  export class Renderer extends SplitPanel.Renderer implements IRenderer {
    readonly titleClassName = "lm-AccordionPanel-title"
    createCollapseIcon(data: Title<Widget>): HTMLElement {
      return document.createElement("span")
    }
    createSectionTitle(data: Title<Widget>): HTMLElement {
      const handle = document.createElement("h3")
      handle.setAttribute("role", "button")
      handle.setAttribute("tabindex", "0")
      handle.id = this.createTitleKey(data)
      handle.className = this.titleClassName
      handle.title = data.caption
      for (const aData in data.dataset) {
        handle.dataset[aData] = data.dataset[aData]
      }
      const collapser = handle.appendChild(this.createCollapseIcon(data))
      collapser.className = "lm-AccordionPanel-titleCollapser"
      const label = handle.appendChild(document.createElement("span"))
      label.className = "lm-AccordionPanel-titleLabel"
      label.textContent = data.label
      return handle
    }
    createTitleKey(data: Title<Widget>): string {
      let key = this._titleKeys.get(data)
      if (key === undefined) {
        key = `title-key-${this._titleID++}`
        this._titleKeys.set(data, key)
      }
      return key
    }
    private _titleID = 0
    private _titleKeys = new WeakMap<Title<Widget>, string>()
  }
  export const defaultRenderer = new Renderer()
}
namespace Private {
  export function createLayout(
    options: AccordionPanel.IOptions
  ): AccordionLayout {
    return (
      options.layout ||
      new AccordionLayout({
        renderer: options.renderer || AccordionPanel.defaultRenderer,
        orientation: options.orientation,
        alignment: options.alignment,
        spacing: options.spacing,
        titleSpace: options.titleSpace,
      })
    )
  }
}
export class BoxSizer {
  sizeHint = 0
  minSize = 0
  maxSize = Infinity
  stretch = 1
  size = 0
  done = false
}
export namespace BoxEngine {
  export function calc(sizers: ArrayLike<BoxSizer>, space: number): number {
    const count = sizers.length
    if (count === 0) {
      return space
    }
    let totalMin = 0
    let totalMax = 0
    let totalSize = 0
    let totalStretch = 0
    let stretchCount = 0
    for (let i = 0; i < count; ++i) {
      const sizer = sizers[i]
      const min = sizer.minSize
      const max = sizer.maxSize
      const hint = sizer.sizeHint
      sizer.done = false
      sizer.size = Math.max(min, Math.min(hint, max))
      totalSize += sizer.size
      totalMin += min
      totalMax += max
      if (sizer.stretch > 0) {
        totalStretch += sizer.stretch
        stretchCount++
      }
    }
    if (space === totalSize) {
      return 0
    }
    if (space <= totalMin) {
      for (let i = 0; i < count; ++i) {
        const sizer = sizers[i]
        sizer.size = sizer.minSize
      }
      return space - totalMin
    }
    if (space >= totalMax) {
      for (let i = 0; i < count; ++i) {
        const sizer = sizers[i]
        sizer.size = sizer.maxSize
      }
      return space - totalMax
    }
    const nearZero = 0.01
    let notDoneCount = count
    if (space < totalSize) {
      let freeSpace = totalSize - space
      while (stretchCount > 0 && freeSpace > nearZero) {
        const distSpace = freeSpace
        const distStretch = totalStretch
        for (let i = 0; i < count; ++i) {
          const sizer = sizers[i]
          if (sizer.done || sizer.stretch === 0) {
            continue
          }
          const amt = (sizer.stretch * distSpace) / distStretch
          if (sizer.size - amt <= sizer.minSize) {
            freeSpace -= sizer.size - sizer.minSize
            totalStretch -= sizer.stretch
            sizer.size = sizer.minSize
            sizer.done = true
            notDoneCount--
            stretchCount--
          } else {
            freeSpace -= amt
            sizer.size -= amt
          }
        }
      }
      while (notDoneCount > 0 && freeSpace > nearZero) {
        const amt = freeSpace / notDoneCount
        for (let i = 0; i < count; ++i) {
          const sizer = sizers[i]
          if (sizer.done) {
            continue
          }
          if (sizer.size - amt <= sizer.minSize) {
            freeSpace -= sizer.size - sizer.minSize
            sizer.size = sizer.minSize
            sizer.done = true
            notDoneCount--
          } else {
            freeSpace -= amt
            sizer.size -= amt
          }
        }
      }
    } else {
      let freeSpace = space - totalSize
      while (stretchCount > 0 && freeSpace > nearZero) {
        const distSpace = freeSpace
        const distStretch = totalStretch
        for (let i = 0; i < count; ++i) {
          const sizer = sizers[i]
          if (sizer.done || sizer.stretch === 0) {
            continue
          }
          const amt = (sizer.stretch * distSpace) / distStretch
          if (sizer.size + amt >= sizer.maxSize) {
            freeSpace -= sizer.maxSize - sizer.size
            totalStretch -= sizer.stretch
            sizer.size = sizer.maxSize
            sizer.done = true
            notDoneCount--
            stretchCount--
          } else {
            freeSpace -= amt
            sizer.size += amt
          }
        }
      }
      while (notDoneCount > 0 && freeSpace > nearZero) {
        const amt = freeSpace / notDoneCount
        for (let i = 0; i < count; ++i) {
          const sizer = sizers[i]
          if (sizer.done) {
            continue
          }
          if (sizer.size + amt >= sizer.maxSize) {
            freeSpace -= sizer.maxSize - sizer.size
            sizer.size = sizer.maxSize
            sizer.done = true
            notDoneCount--
          } else {
            freeSpace -= amt
            sizer.size += amt
          }
        }
      }
    }
    return 0
  }
  export function adjust(
    sizers: ArrayLike<BoxSizer>,
    index: number,
    delta: number
  ): void {
    if (sizers.length === 0 || delta === 0) {
      return
    }
    if (delta > 0) {
      growSizer(sizers, index, delta)
    } else {
      shrinkSizer(sizers, index, -delta)
    }
  }
  function growSizer(
    sizers: ArrayLike<BoxSizer>,
    index: number,
    delta: number
  ): void {
    let growLimit = 0
    for (let i = 0; i <= index; ++i) {
      const sizer = sizers[i]
      growLimit += sizer.maxSize - sizer.size
    }
    let shrinkLimit = 0
    for (let i = index + 1, n = sizers.length; i < n; ++i) {
      const sizer = sizers[i]
      shrinkLimit += sizer.size - sizer.minSize
    }
    delta = Math.min(delta, growLimit, shrinkLimit)
    let grow = delta
    for (let i = index; i >= 0 && grow > 0; --i) {
      const sizer = sizers[i]
      const limit = sizer.maxSize - sizer.size
      if (limit >= grow) {
        sizer.sizeHint = sizer.size + grow
        grow = 0
      } else {
        sizer.sizeHint = sizer.size + limit
        grow -= limit
      }
    }
    let shrink = delta
    for (let i = index + 1, n = sizers.length; i < n && shrink > 0; ++i) {
      const sizer = sizers[i]
      const limit = sizer.size - sizer.minSize
      if (limit >= shrink) {
        sizer.sizeHint = sizer.size - shrink
        shrink = 0
      } else {
        sizer.sizeHint = sizer.size - limit
        shrink -= limit
      }
    }
  }
  function shrinkSizer(
    sizers: ArrayLike<BoxSizer>,
    index: number,
    delta: number
  ): void {
    let growLimit = 0
    for (let i = index + 1, n = sizers.length; i < n; ++i) {
      const sizer = sizers[i]
      growLimit += sizer.maxSize - sizer.size
    }
    let shrinkLimit = 0
    for (let i = 0; i <= index; ++i) {
      const sizer = sizers[i]
      shrinkLimit += sizer.size - sizer.minSize
    }
    delta = Math.min(delta, growLimit, shrinkLimit)
    let grow = delta
    for (let i = index + 1, n = sizers.length; i < n && grow > 0; ++i) {
      const sizer = sizers[i]
      const limit = sizer.maxSize - sizer.size
      if (limit >= grow) {
        sizer.sizeHint = sizer.size + grow
        grow = 0
      } else {
        sizer.sizeHint = sizer.size + limit
        grow -= limit
      }
    }
    let shrink = delta
    for (let i = index; i >= 0 && shrink > 0; --i) {
      const sizer = sizers[i]
      const limit = sizer.size - sizer.minSize
      if (limit >= shrink) {
        sizer.sizeHint = sizer.size - shrink
        shrink = 0
      } else {
        sizer.sizeHint = sizer.size - limit
        shrink -= limit
      }
    }
  }
}
export class BoxLayout extends PanelLayout {
  constructor(options: BoxLayout.IOptions = {}) {
    super()
    if (options.direction !== undefined) {
      this._direction = options.direction
    }
    if (options.alignment !== undefined) {
      this._alignment = options.alignment
    }
    if (options.spacing !== undefined) {
      this._spacing = Utils.clampDimension(options.spacing)
    }
  }
  dispose(): void {
    for (const item of this._items) {
      item.dispose()
    }
    this._box = null
    this._items.length = 0
    this._sizers.length = 0
    super.dispose()
  }
  get direction(): BoxLayout.Direction {
    return this._direction
  }
  set direction(value: BoxLayout.Direction) {
    if (this._direction === value) {
      return
    }
    this._direction = value
    if (!this.parent) {
      return
    }
    this.parent.dataset["direction"] = value
    this.parent.fit()
  }
  get alignment(): BoxLayout.Alignment {
    return this._alignment
  }
  set alignment(value: BoxLayout.Alignment) {
    if (this._alignment === value) {
      return
    }
    this._alignment = value
    if (!this.parent) {
      return
    }
    this.parent.dataset["alignment"] = value
    this.parent.update()
  }
  get spacing(): number {
    return this._spacing
  }
  set spacing(value: number) {
    value = Utils.clampDimension(value)
    if (this._spacing === value) {
      return
    }
    this._spacing = value
    if (!this.parent) {
      return
    }
    this.parent.fit()
  }
  protected init(): void {
    this.parent!.dataset["direction"] = this.direction
    this.parent!.dataset["alignment"] = this.alignment
    super.init()
  }
  protected attachWidget(index: number, widget: Widget): void {
    ArrayExt.insert(this._items, index, new LayoutItem(widget))
    ArrayExt.insert(this._sizers, index, new BoxSizer())
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach)
    }
    this.parent!.node.appendChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach)
    }
    this.parent!.fit()
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    ArrayExt.move(this._items, fromIndex, toIndex)
    ArrayExt.move(this._sizers, fromIndex, toIndex)
    this.parent!.update()
  }
  protected detachWidget(index: number, widget: Widget): void {
    const item = ArrayExt.removeAt(this._items, index)
    ArrayExt.removeAt(this._sizers, index)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach)
    }
    this.parent!.node.removeChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach)
    }
    item!.dispose()
    this.parent!.fit()
  }
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg)
    this.parent!.update()
  }
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg)
    this.parent!.fit()
  }
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height)
    }
  }
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1)
    }
  }
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit()
    }
  }
  private _fit(): void {
    let nVisible = 0
    for (let i = 0, n = this._items.length; i < n; ++i) {
      nVisible += +!this._items[i].isHidden
    }
    this._fixed = this._spacing * Math.max(0, nVisible - 1)
    const horz = Private.isHorizontal(this._direction)
    let minW = horz ? this._fixed : 0
    let minH = horz ? 0 : this._fixed
    for (let i = 0, n = this._items.length; i < n; ++i) {
      const item = this._items[i]
      const sizer = this._sizers[i]
      if (item.isHidden) {
        sizer.minSize = 0
        sizer.maxSize = 0
        continue
      }
      item.fit()
      sizer.sizeHint = BoxLayout.getSizeBasis(item.widget)
      sizer.stretch = BoxLayout.getStretch(item.widget)
      if (horz) {
        sizer.minSize = item.minWidth
        sizer.maxSize = item.maxWidth
        minW += item.minWidth
        minH = Math.max(minH, item.minHeight)
      } else {
        sizer.minSize = item.minHeight
        sizer.maxSize = item.maxHeight
        minH += item.minHeight
        minW = Math.max(minW, item.minWidth)
      }
    }
    const box = (this._box = ElementExt.boxSizing(this.parent!.node))
    minW += box.horizontalSum
    minH += box.verticalSum
    const style = this.parent!.node.style
    style.minWidth = `${minW}px`
    style.minHeight = `${minH}px`
    this._dirty = true
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest)
    }
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest)
    }
  }
  private _update(offsetWidth: number, offsetHeight: number): void {
    this._dirty = false
    let nVisible = 0
    for (let i = 0, n = this._items.length; i < n; ++i) {
      nVisible += +!this._items[i].isHidden
    }
    if (nVisible === 0) {
      return
    }
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight
    }
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node)
    }
    let top = this._box.paddingTop
    let left = this._box.paddingLeft
    const width = offsetWidth - this._box.horizontalSum
    const height = offsetHeight - this._box.verticalSum
    let delta: number
    switch (this._direction) {
      case "left-to-right":
        delta = BoxEngine.calc(this._sizers, Math.max(0, width - this._fixed))
        break
      case "top-to-bottom":
        delta = BoxEngine.calc(this._sizers, Math.max(0, height - this._fixed))
        break
      case "right-to-left":
        delta = BoxEngine.calc(this._sizers, Math.max(0, width - this._fixed))
        left += width
        break
      case "bottom-to-top":
        delta = BoxEngine.calc(this._sizers, Math.max(0, height - this._fixed))
        top += height
        break
      default:
        throw "unreachable"
    }
    let extra = 0
    let offset = 0
    if (delta > 0) {
      switch (this._alignment) {
        case "start":
          break
        case "center":
          extra = 0
          offset = delta / 2
          break
        case "end":
          extra = 0
          offset = delta
          break
        case "justify":
          extra = delta / nVisible
          offset = 0
          break
        default:
          throw "unreachable"
      }
    }
    for (let i = 0, n = this._items.length; i < n; ++i) {
      const item = this._items[i]
      if (item.isHidden) {
        continue
      }
      const size = this._sizers[i].size
      switch (this._direction) {
        case "left-to-right":
          item.update(left + offset, top, size + extra, height)
          left += size + extra + this._spacing
          break
        case "top-to-bottom":
          item.update(left, top + offset, width, size + extra)
          top += size + extra + this._spacing
          break
        case "right-to-left":
          item.update(left - offset - size - extra, top, size + extra, height)
          left -= size + extra + this._spacing
          break
        case "bottom-to-top":
          item.update(left, top - offset - size - extra, width, size + extra)
          top -= size + extra + this._spacing
          break
        default:
          throw "unreachable"
      }
    }
  }
  private _fixed = 0
  private _spacing = 4
  private _dirty = false
  private _sizers: BoxSizer[] = []
  private _items: LayoutItem[] = []
  private _box: ElementExt.IBoxSizing | null = null
  private _alignment: BoxLayout.Alignment = "start"
  private _direction: BoxLayout.Direction = "top-to-bottom"
}
export namespace BoxLayout {
  export type Direction =
    | "left-to-right"
    | "right-to-left"
    | "top-to-bottom"
    | "bottom-to-top"
  export type Alignment = "start" | "center" | "end" | "justify"
  export interface IOptions {
    direction?: Direction
    alignment?: Alignment
    spacing?: number
  }
  export function getStretch(widget: Widget): number {
    return Private.stretchProperty.get(widget)
  }
  export function setStretch(widget: Widget, value: number): void {
    Private.stretchProperty.set(widget, value)
  }
  export function getSizeBasis(widget: Widget): number {
    return Private.sizeBasisProperty.get(widget)
  }
  export function setSizeBasis(widget: Widget, value: number): void {
    Private.sizeBasisProperty.set(widget, value)
  }
}
namespace Private {
  export const stretchProperty = new AttachedProperty<Widget, number>({
    name: "stretch",
    create: () => 0,
    coerce: (owner, value) => Math.max(0, Math.floor(value)),
    changed: onChildSizingChanged,
  })
  export const sizeBasisProperty = new AttachedProperty<Widget, number>({
    name: "sizeBasis",
    create: () => 0,
    coerce: (owner, value) => Math.max(0, Math.floor(value)),
    changed: onChildSizingChanged,
  })
  export function isHorizontal(dir: BoxLayout.Direction): boolean {
    return dir === "left-to-right" || dir === "right-to-left"
  }
  export function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value))
  }
  function onChildSizingChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof BoxLayout) {
      child.parent.fit()
    }
  }
}
export class BoxPanel extends Panel {
  constructor(options: BoxPanel.IOptions = {}) {
    super({ layout: Private.createLayout(options) })
    this.addClass("lm-BoxPanel")
  }
  get direction(): BoxPanel.Direction {
    return (this.layout as BoxLayout).direction
  }
  set direction(value: BoxPanel.Direction) {
    ;(this.layout as BoxLayout).direction = value
  }
  get alignment(): BoxPanel.Alignment {
    return (this.layout as BoxLayout).alignment
  }
  set alignment(value: BoxPanel.Alignment) {
    ;(this.layout as BoxLayout).alignment = value
  }
  get spacing(): number {
    return (this.layout as BoxLayout).spacing
  }
  set spacing(value: number) {
    ;(this.layout as BoxLayout).spacing = value
  }
  protected onChildAdded(msg: Widget.ChildMessage): void {
    msg.child.addClass("lm-BoxPanel-child")
  }
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    msg.child.removeClass("lm-BoxPanel-child")
  }
}
export namespace BoxPanel {
  export type Direction = BoxLayout.Direction
  export type Alignment = BoxLayout.Alignment
  export interface IOptions {
    direction?: Direction
    alignment?: Alignment
    spacing?: number
    layout?: BoxLayout
  }
  export function getStretch(widget: Widget): number {
    return BoxLayout.getStretch(widget)
  }
  export function setStretch(widget: Widget, value: number): void {
    BoxLayout.setStretch(widget, value)
  }
  export function getSizeBasis(widget: Widget): number {
    return BoxLayout.getSizeBasis(widget)
  }
  export function setSizeBasis(widget: Widget, value: number): void {
    BoxLayout.setSizeBasis(widget, value)
  }
}
namespace Private {
  export function createLayout(options: BoxPanel.IOptions): BoxLayout {
    return options.layout || new BoxLayout(options)
  }
}
export class CommandPalette extends Widget {
  constructor(options: CommandPalette.IOptions) {
    super({ node: Private.createNode() })
    this.addClass("lm-CommandPalette")
    this.setFlag(Widget.Flag.DisallowLayout)
    this.commands = options.commands
    this.renderer = options.renderer || CommandPalette.defaultRenderer
    this.commands.commandChanged.connect(this._onGenericChange, this)
    this.commands.keyBindingChanged.connect(this._onGenericChange, this)
  }
  dispose(): void {
    this._items.length = 0
    this._results = null
    super.dispose()
  }
  readonly commands: CommandRegistry
  readonly renderer: CommandPalette.IRenderer
  get searchNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      "lm-CommandPalette-search"
    )[0] as HTMLDivElement
  }
  get inputNode(): HTMLInputElement {
    return this.node.getElementsByClassName(
      "lm-CommandPalette-input"
    )[0] as HTMLInputElement
  }
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(
      "lm-CommandPalette-content"
    )[0] as HTMLUListElement
  }
  get items(): ReadonlyArray<CommandPalette.IItem> {
    return this._items
  }
  addItem(options: CommandPalette.IItemOptions): CommandPalette.IItem {
    const item = Private.createItem(this.commands, options)
    this._items.push(item)
    this.refresh()
    return item
  }
  addItems(items: CommandPalette.IItemOptions[]): CommandPalette.IItem[] {
    const newItems = items.map(item => Private.createItem(this.commands, item))
    newItems.forEach(item => this._items.push(item))
    this.refresh()
    return newItems
  }
  removeItem(item: CommandPalette.IItem): void {
    this.removeItemAt(this._items.indexOf(item))
  }
  removeItemAt(index: number): void {
    const item = ArrayExt.removeAt(this._items, index)
    if (!item) {
      return
    }
    this.refresh()
  }
  clearItems(): void {
    if (this._items.length === 0) {
      return
    }
    this._items.length = 0
    this.refresh()
  }
  refresh(): void {
    this._results = null
    if (this.inputNode.value !== "") {
      const clear = this.node.getElementsByClassName(
        "lm-close-icon"
      )[0] as HTMLInputElement
      clear.style.display = "inherit"
    } else {
      const clear = this.node.getElementsByClassName(
        "lm-close-icon"
      )[0] as HTMLInputElement
      clear.style.display = "none"
    }
    this.update()
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "click":
        this._evtClick(event as MouseEvent)
        break
      case "keydown":
        this._evtKeyDown(event as KeyboardEvent)
        break
      case "input":
        this.refresh()
        break
      case "focus":
      case "blur":
        this._toggleFocused()
        break
    }
  }
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener("click", this)
    this.node.addEventListener("keydown", this)
    this.node.addEventListener("input", this)
    this.node.addEventListener("focus", this, true)
    this.node.addEventListener("blur", this, true)
  }
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener("click", this)
    this.node.removeEventListener("keydown", this)
    this.node.removeEventListener("input", this)
    this.node.removeEventListener("focus", this, true)
    this.node.removeEventListener("blur", this, true)
  }
  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      const input = this.inputNode
      input.focus()
      input.select()
    }
  }
  protected onUpdateRequest(msg: Message): void {
    const query = this.inputNode.value
    const contentNode = this.contentNode
    let results = this._results
    if (!results) {
      results = this._results = Private.search(this._items, query)
      this._activeIndex = query
        ? ArrayExt.findFirstIndex(results, Private.canActivate)
        : -1
    }
    if (!query && results.length === 0) {
      VirtualDOM.render(null, contentNode)
      return
    }
    if (query && results.length === 0) {
      const content = this.renderer.renderEmptyMessage({ query })
      VirtualDOM.render(content, contentNode)
      return
    }
    const renderer = this.renderer
    const activeIndex = this._activeIndex
    const content = new Array<VirtualElement>(results.length)
    for (let i = 0, n = results.length; i < n; ++i) {
      const result = results[i]
      if (result.type === "header") {
        const indices = result.indices
        const category = result.category
        content[i] = renderer.renderHeader({ category, indices })
      } else {
        const item = result.item
        const indices = result.indices
        const active = i === activeIndex
        content[i] = renderer.renderItem({ item, indices, active })
      }
    }
    VirtualDOM.render(content, contentNode)
    if (activeIndex < 0 || activeIndex >= results.length) {
      contentNode.scrollTop = 0
    } else {
      const element = contentNode.children[activeIndex]
      ElementExt.scrollIntoViewIfNeeded(contentNode, element)
    }
  }
  private _evtClick(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    if ((event.target as HTMLElement).classList.contains("lm-close-icon")) {
      this.inputNode.value = ""
      this.refresh()
      return
    }
    const index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return node.contains(event.target as HTMLElement)
    })
    if (index === -1) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this._execute(index)
  }
  private _evtKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return
    }
    switch (event.keyCode) {
      case 13: // Enter
        event.preventDefault()
        event.stopPropagation()
        this._execute(this._activeIndex)
        break
      case 38: // Up Arrow
        event.preventDefault()
        event.stopPropagation()
        this._activatePreviousItem()
        break
      case 40: // Down Arrow
        event.preventDefault()
        event.stopPropagation()
        this._activateNextItem()
        break
    }
  }
  private _activateNextItem(): void {
    if (!this._results || this._results.length === 0) {
      return
    }
    const ai = this._activeIndex
    const n = this._results.length
    const start = ai < n - 1 ? ai + 1 : 0
    const stop = start === 0 ? n - 1 : start - 1
    this._activeIndex = ArrayExt.findFirstIndex(
      this._results,
      Private.canActivate,
      start,
      stop
    )
    this.update()
  }
  private _activatePreviousItem(): void {
    if (!this._results || this._results.length === 0) {
      return
    }
    const ai = this._activeIndex
    const n = this._results.length
    const start = ai <= 0 ? n - 1 : ai - 1
    const stop = start === n - 1 ? 0 : start + 1
    this._activeIndex = ArrayExt.findLastIndex(
      this._results,
      Private.canActivate,
      start,
      stop
    )
    this.update()
  }
  private _execute(index: number): void {
    if (!this._results) {
      return
    }
    const part = this._results[index]
    if (!part) {
      return
    }
    if (part.type === "header") {
      const input = this.inputNode
      input.value = `${part.category.toLowerCase()} `
      input.focus()
      this.refresh()
      return
    }
    if (!part.item.isEnabled) {
      return
    }
    this.commands.execute(part.item.command, part.item.args)
    this.inputNode.value = ""
    this.refresh()
  }
  private _toggleFocused(): void {
    const focused = document.activeElement === this.inputNode
    this.toggleClass("lm-mod-focused", focused)
  }
  private _onGenericChange(): void {
    this.refresh()
  }
  private _activeIndex = -1
  private _items: CommandPalette.IItem[] = []
  private _results: Private.SearchResult[] | null = null
}
export namespace CommandPalette {
  export interface IOptions {
    commands: CommandRegistry
    renderer?: IRenderer
  }
  export interface IItemOptions {
    category: string
    command: string
    args?: ReadonlyJSONObject
    rank?: number
  }
  export interface IItem {
    readonly command: string
    readonly args: ReadonlyJSONObject
    readonly category: string
    readonly rank: number
    readonly label: string
    readonly caption: string
    readonly icon: VirtualElement.IRenderer | undefined
    readonly iconClass: string
    readonly iconLabel: string
    readonly className: string
    readonly dataset: CommandRegistry.Dataset
    readonly isEnabled: boolean
    readonly isToggled: boolean
    readonly isToggleable: boolean
    readonly isVisible: boolean
    readonly keyBinding: CommandRegistry.IKeyBinding | null
  }
  export interface IHeaderRenderData {
    readonly category: string
    readonly indices: ReadonlyArray<number> | null
  }
  export interface IItemRenderData {
    readonly item: IItem
    readonly indices: ReadonlyArray<number> | null
    readonly active: boolean
  }
  export interface IEmptyMessageRenderData {
    query: string
  }
  export interface IRenderer {
    renderHeader(data: IHeaderRenderData): VirtualElement
    renderItem(data: IItemRenderData): VirtualElement
    renderEmptyMessage(data: IEmptyMessageRenderData): VirtualElement
  }
  export class Renderer implements IRenderer {
    renderHeader(data: IHeaderRenderData): VirtualElement {
      const content = this.formatHeader(data)
      return h.li({ className: "lm-CommandPalette-header" }, content)
    }
    renderItem(data: IItemRenderData): VirtualElement {
      const className = this.createItemClass(data)
      const dataset = this.createItemDataset(data)
      if (data.item.isToggleable) {
        return h.li(
          {
            className,
            dataset,
            role: "checkbox",
            "aria-checked": `${data.item.isToggled}`,
          },
          this.renderItemIcon(data),
          this.renderItemContent(data),
          this.renderItemShortcut(data)
        )
      }
      return h.li(
        {
          className,
          dataset,
        },
        this.renderItemIcon(data),
        this.renderItemContent(data),
        this.renderItemShortcut(data)
      )
    }
    renderEmptyMessage(data: IEmptyMessageRenderData): VirtualElement {
      const content = this.formatEmptyMessage(data)
      return h.li({ className: "lm-CommandPalette-emptyMessage" }, content)
    }
    renderItemIcon(data: IItemRenderData): VirtualElement {
      const className = this.createIconClass(data)
      return h.div({ className }, data.item.icon!, data.item.iconLabel)
    }
    renderItemContent(data: IItemRenderData): VirtualElement {
      return h.div(
        { className: "lm-CommandPalette-itemContent" },
        this.renderItemLabel(data),
        this.renderItemCaption(data)
      )
    }
    renderItemLabel(data: IItemRenderData): VirtualElement {
      const content = this.formatItemLabel(data)
      return h.div({ className: "lm-CommandPalette-itemLabel" }, content)
    }
    renderItemCaption(data: IItemRenderData): VirtualElement {
      const content = this.formatItemCaption(data)
      return h.div({ className: "lm-CommandPalette-itemCaption" }, content)
    }
    renderItemShortcut(data: IItemRenderData): VirtualElement {
      const content = this.formatItemShortcut(data)
      return h.div({ className: "lm-CommandPalette-itemShortcut" }, content)
    }
    createItemClass(data: IItemRenderData): string {
      let name = "lm-CommandPalette-item"
      if (!data.item.isEnabled) {
        name += " lm-mod-disabled"
      }
      if (data.item.isToggled) {
        name += " lm-mod-toggled"
      }
      if (data.active) {
        name += " lm-mod-active"
      }
      const extra = data.item.className
      if (extra) {
        name += ` ${extra}`
      }
      return name
    }
    createItemDataset(data: IItemRenderData): ElementDataset {
      return { ...data.item.dataset, command: data.item.command }
    }
    createIconClass(data: IItemRenderData): string {
      const name = "lm-CommandPalette-itemIcon"
      const extra = data.item.iconClass
      return extra ? `${name} ${extra}` : name
    }
    formatHeader(data: IHeaderRenderData): h.Child {
      if (!data.indices || data.indices.length === 0) {
        return data.category
      }
      return StringExt.highlight(data.category, data.indices, h.mark)
    }
    formatEmptyMessage(data: IEmptyMessageRenderData): h.Child {
      return `No commands found that match '${data.query}'`
    }
    formatItemShortcut(data: IItemRenderData): h.Child {
      const kb = data.item.keyBinding
      return kb ? kb.keys.map(CommandRegistry.formatKeystroke).join(", ") : null
    }
    formatItemLabel(data: IItemRenderData): h.Child {
      if (!data.indices || data.indices.length === 0) {
        return data.item.label
      }
      return StringExt.highlight(data.item.label, data.indices, h.mark)
    }
    formatItemCaption(data: IItemRenderData): h.Child {
      return data.item.caption
    }
  }
  export const defaultRenderer = new Renderer()
}
namespace Private {
  export function createNode(): HTMLDivElement {
    const node = document.createElement("div")
    const search = document.createElement("div")
    const wrapper = document.createElement("div")
    const input = document.createElement("input")
    const content = document.createElement("ul")
    const clear = document.createElement("button")
    search.className = "lm-CommandPalette-search"
    wrapper.className = "lm-CommandPalette-wrapper"
    input.className = "lm-CommandPalette-input"
    clear.className = "lm-close-icon"
    content.className = "lm-CommandPalette-content"
    input.spellcheck = false
    wrapper.appendChild(input)
    wrapper.appendChild(clear)
    search.appendChild(wrapper)
    node.appendChild(search)
    node.appendChild(content)
    return node
  }
  export function createItem(
    commands: CommandRegistry,
    options: CommandPalette.IItemOptions
  ): CommandPalette.IItem {
    return new CommandItem(commands, options)
  }
  export interface IHeaderResult {
    readonly type: "header"
    readonly category: string
    readonly indices: ReadonlyArray<number> | null
  }
  export interface IItemResult {
    readonly type: "item"
    readonly item: CommandPalette.IItem
    readonly indices: ReadonlyArray<number> | null
  }
  export type SearchResult = IHeaderResult | IItemResult
  export function search(
    items: CommandPalette.IItem[],
    query: string
  ): SearchResult[] {
    const scores = matchItems(items, query)
    scores.sort(scoreCmp)
    return createResults(scores)
  }
  export function canActivate(result: SearchResult): boolean {
    return result.type === "item" && result.item.isEnabled
  }
  function normalizeCategory(category: string): string {
    return category.trim().replace(/\s+/g, " ")
  }
  function normalizeQuery(text: string): string {
    return text.replace(/\s+/g, "").toLowerCase()
  }
  const enum MatchType {
    Label,
    Category,
    Split,
    Default,
  }
  interface IScore {
    matchType: MatchType
    score: number
    categoryIndices: number[] | null
    labelIndices: number[] | null
    item: CommandPalette.IItem
  }
  function matchItems(items: CommandPalette.IItem[], query: string): IScore[] {
    query = normalizeQuery(query)
    const scores: IScore[] = []
    for (let i = 0, n = items.length; i < n; ++i) {
      const item = items[i]
      if (!item.isVisible) {
        continue
      }
      if (!query) {
        scores.push({
          matchType: MatchType.Default,
          categoryIndices: null,
          labelIndices: null,
          score: 0,
          item,
        })
        continue
      }
      const score = fuzzySearch(item, query)
      if (!score) {
        continue
      }
      if (!item.isEnabled) {
        score.score += 1000
      }
      scores.push(score)
    }
    return scores
  }
  function fuzzySearch(
    item: CommandPalette.IItem,
    query: string
  ): IScore | null {
    const category = item.category.toLowerCase()
    const label = item.label.toLowerCase()
    const source = `${category} ${label}`
    let score = Infinity
    let indices: number[] | null = null
    const rgx = /\b\w/g
    while (true) {
      const rgxMatch = rgx.exec(source)
      if (!rgxMatch) {
        break
      }
      const match = StringExt.matchSumOfDeltas(source, query, rgxMatch.index)
      if (!match) {
        break
      }
      if (match && match.score <= score) {
        score = match.score
        indices = match.indices
      }
    }
    if (!indices || score === Infinity) {
      return null
    }
    const pivot = category.length + 1
    const j = ArrayExt.lowerBound(indices, pivot, (a, b) => a - b)
    const categoryIndices = indices.slice(0, j)
    const labelIndices = indices.slice(j)
    for (let i = 0, n = labelIndices.length; i < n; ++i) {
      labelIndices[i] -= pivot
    }
    if (categoryIndices.length === 0) {
      return {
        matchType: MatchType.Label,
        categoryIndices: null,
        labelIndices,
        score,
        item,
      }
    }
    if (labelIndices.length === 0) {
      return {
        matchType: MatchType.Category,
        categoryIndices,
        labelIndices: null,
        score,
        item,
      }
    }
    return {
      matchType: MatchType.Split,
      categoryIndices,
      labelIndices,
      score,
      item,
    }
  }
  function scoreCmp(a: IScore, b: IScore): number {
    const m1 = a.matchType - b.matchType
    if (m1 !== 0) {
      return m1
    }
    const d1 = a.score - b.score
    if (d1 !== 0) {
      return d1
    }
    let i1 = 0
    let i2 = 0
    switch (a.matchType) {
      case MatchType.Label:
        i1 = a.labelIndices![0]
        i2 = b.labelIndices![0]
        break
      case MatchType.Category:
      case MatchType.Split:
        i1 = a.categoryIndices![0]
        i2 = b.categoryIndices![0]
        break
    }
    if (i1 !== i2) {
      return i1 - i2
    }
    const d2 = a.item.category.localeCompare(b.item.category)
    if (d2 !== 0) {
      return d2
    }
    const r1 = a.item.rank
    const r2 = b.item.rank
    if (r1 !== r2) {
      return r1 < r2 ? -1 : 1 // Infinity safe
    }
    return a.item.label.localeCompare(b.item.label)
  }
  function createResults(scores: IScore[]): SearchResult[] {
    const visited = new Array(scores.length)
    ArrayExt.fill(visited, false)
    const results: SearchResult[] = []
    for (let i = 0, n = scores.length; i < n; ++i) {
      if (visited[i]) {
        continue
      }
      const { item, categoryIndices } = scores[i]
      const category = item.category
      results.push({ type: "header", category, indices: categoryIndices })
      for (let j = i; j < n; ++j) {
        if (visited[j]) {
          continue
        }
        const { item, labelIndices } = scores[j]
        if (item.category !== category) {
          continue
        }
        results.push({ type: "item", item, indices: labelIndices })
        visited[j] = true
      }
    }
    return results
  }
  class CommandItem implements CommandPalette.IItem {
    constructor(
      commands: CommandRegistry,
      options: CommandPalette.IItemOptions
    ) {
      this._commands = commands
      this.category = normalizeCategory(options.category)
      this.command = options.command
      this.args = options.args || JSONExt.emptyObject
      this.rank = options.rank !== undefined ? options.rank : Infinity
    }
    readonly category: string
    readonly command: string
    readonly args: ReadonlyJSONObject
    readonly rank: number
    get label(): string {
      return this._commands.label(this.command, this.args)
    }
    get icon(): VirtualElement.IRenderer | undefined {
      return this._commands.icon(this.command, this.args)
    }
    get iconClass(): string {
      return this._commands.iconClass(this.command, this.args)
    }
    get iconLabel(): string {
      return this._commands.iconLabel(this.command, this.args)
    }
    get caption(): string {
      return this._commands.caption(this.command, this.args)
    }
    get className(): string {
      return this._commands.className(this.command, this.args)
    }
    get dataset(): CommandRegistry.Dataset {
      return this._commands.dataset(this.command, this.args)
    }
    get isEnabled(): boolean {
      return this._commands.isEnabled(this.command, this.args)
    }
    get isToggled(): boolean {
      return this._commands.isToggled(this.command, this.args)
    }
    get isToggleable(): boolean {
      return this._commands.isToggleable(this.command, this.args)
    }
    get isVisible(): boolean {
      return this._commands.isVisible(this.command, this.args)
    }
    get keyBinding(): CommandRegistry.IKeyBinding | null {
      const { command, args } = this
      return (
        ArrayExt.findLastValue(this._commands.keyBindings, kb => {
          return kb.command === command && JSONExt.deepEqual(kb.args, args)
        }) || null
      )
    }
    private _commands: CommandRegistry
  }
}
export class ContextMenu {
  constructor(options: ContextMenu.IOptions) {
    const { groupByTarget, sortBySelector, ...others } = options
    this.menu = new Menu(others)
    this._groupByTarget = groupByTarget !== false
    this._sortBySelector = sortBySelector !== false
  }
  readonly menu: Menu
  addItem(options: ContextMenu.IItemOptions): IDisposable {
    const item = Private.createItem(options, this._idTick++)
    this._items.push(item)
    return new DisposableDelegate(() => {
      ArrayExt.removeFirstOf(this._items, item)
    })
  }
  open(event: MouseEvent): boolean {
    this.menu.clearItems()
    if (this._items.length === 0) {
      return false
    }
    const items = Private.matchItems(
      this._items,
      event,
      this._groupByTarget,
      this._sortBySelector
    )
    if (!items || items.length === 0) {
      return false
    }
    for (const item of items) {
      this.menu.addItem(item)
    }
    this.menu.open(event.clientX, event.clientY)
    return true
  }
  private _groupByTarget: boolean = true
  private _idTick = 0
  private _items: Private.IItem[] = []
  private _sortBySelector: boolean = true
}
export namespace ContextMenu {
  export interface IOptions {
    commands: CommandRegistry
    renderer?: Menu.IRenderer
    sortBySelector?: boolean
    groupByTarget?: boolean
  }
  export interface IItemOptions extends Menu.IItemOptions {
    selector: string
    rank?: number
  }
}
namespace Private {
  export interface IItem extends Menu.IItemOptions {
    selector: string
    rank: number
    id: number
  }
  export function createItem(
    options: ContextMenu.IItemOptions,
    id: number
  ): IItem {
    const selector = validateSelector(options.selector)
    const rank = options.rank !== undefined ? options.rank : Infinity
    return { ...options, selector, rank, id }
  }
  export function matchItems(
    items: IItem[],
    event: MouseEvent,
    groupByTarget: boolean,
    sortBySelector: boolean
  ): IItem[] | null {
    let target = event.target as Element | null
    if (!target) {
      return null
    }
    const currentTarget = event.currentTarget as Element | null
    if (!currentTarget) {
      return null
    }
    if (!currentTarget.contains(target)) {
      target = document.elementFromPoint(event.clientX, event.clientY)
      if (!target || !currentTarget.contains(target)) {
        return null
      }
    }
    const result: IItem[] = []
    const availableItems: Array<IItem | null> = items.slice()
    while (target !== null) {
      const matches: IItem[] = []
      for (let i = 0, n = availableItems.length; i < n; ++i) {
        const item = availableItems[i]
        if (!item) {
          continue
        }
        if (!Selector.matches(target, item.selector)) {
          continue
        }
        matches.push(item)
        availableItems[i] = null
      }
      if (matches.length !== 0) {
        if (groupByTarget) {
          matches.sort(sortBySelector ? itemCmp : itemCmpRank)
        }
        result.push(...matches)
      }
      if (target === currentTarget) {
        break
      }
      target = target.parentElement
    }
    if (!groupByTarget) {
      result.sort(sortBySelector ? itemCmp : itemCmpRank)
    }
    return result
  }
  function validateSelector(selector: string): string {
    if (selector.indexOf(",") !== -1) {
      throw new Error(`Selector cannot contain commas: ${selector}`)
    }
    if (!Selector.isValid(selector)) {
      throw new Error(`Invalid selector: ${selector}`)
    }
    return selector
  }
  function itemCmpRank(a: IItem, b: IItem): number {
    const r1 = a.rank
    const r2 = b.rank
    if (r1 !== r2) {
      return r1 < r2 ? -1 : 1 // Infinity-safe
    }
    return a.id - b.id
  }
  function itemCmp(a: IItem, b: IItem): number {
    const s1 = Selector.calculateSpecificity(a.selector)
    const s2 = Selector.calculateSpecificity(b.selector)
    if (s1 !== s2) {
      return s2 - s1
    }
    return itemCmpRank(a, b)
  }
}
export class DockLayout extends Layout {
  constructor(options: DockLayout.IOptions) {
    super()
    this.renderer = options.renderer
    if (options.spacing !== undefined) {
      this._spacing = Utils.clampDimension(options.spacing)
    }
    this._document = options.document || document
    this._hiddenMode =
      options.hiddenMode !== undefined
        ? options.hiddenMode
        : Widget.HiddenMode.Display
  }
  dispose(): void {
    const widgets = this[Symbol.iterator]()
    this._items.forEach(item => {
      item.dispose()
    })
    this._box = null
    this._root = null
    this._items.clear()
    for (const widget of widgets) {
      widget.dispose()
    }
    super.dispose()
  }
  readonly renderer: DockLayout.IRenderer
  get hiddenMode(): Widget.HiddenMode {
    return this._hiddenMode
  }
  set hiddenMode(v: Widget.HiddenMode) {
    if (this._hiddenMode === v) {
      return
    }
    this._hiddenMode = v
    for (const bar of this.tabBars()) {
      if (bar.titles.length > 1) {
        for (const title of bar.titles) {
          title.owner.hiddenMode = this._hiddenMode
        }
      }
    }
  }
  get spacing(): number {
    return this._spacing
  }
  set spacing(value: number) {
    value = Utils.clampDimension(value)
    if (this._spacing === value) {
      return
    }
    this._spacing = value
    if (!this.parent) {
      return
    }
    this.parent.fit()
  }
  get isEmpty(): boolean {
    return this._root === null
  }
  *[Symbol.iterator](): IterableIterator<Widget> {
    if (this._root) {
      yield* this._root.iterAllWidgets()
    }
  }
  *widgets(): IterableIterator<Widget> {
    if (this._root) {
      yield* this._root.iterUserWidgets()
    }
  }
  *selectedWidgets(): IterableIterator<Widget> {
    if (this._root) {
      yield* this._root.iterSelectedWidgets()
    }
  }
  *tabBars(): IterableIterator<TabBar<Widget>> {
    if (this._root) {
      yield* this._root.iterTabBars()
    }
  }
  *handles(): IterableIterator<HTMLDivElement> {
    if (this._root) {
      yield* this._root.iterHandles()
    }
  }
  moveHandle(handle: HTMLDivElement, offsetX: number, offsetY: number): void {
    const hidden = handle.classList.contains("lm-mod-hidden")
    if (!this._root || hidden) {
      return
    }
    const data = this._root.findSplitNode(handle)
    if (!data) {
      return
    }
    let delta: number
    if (data.node.orientation === "horizontal") {
      delta = offsetX - handle.offsetLeft
    } else {
      delta = offsetY - handle.offsetTop
    }
    if (delta === 0) {
      return
    }
    data.node.holdSizes()
    BoxEngine.adjust(data.node.sizers, data.index, delta)
    if (this.parent) {
      this.parent.update()
    }
  }
  saveLayout(): DockLayout.ILayoutConfig {
    if (!this._root) {
      return { main: null }
    }
    this._root.holdAllSizes()
    return { main: this._root.createConfig() }
  }
  restoreLayout(config: DockLayout.ILayoutConfig): void {
    const widgetSet = new Set<Widget>()
    let mainConfig: DockLayout.AreaConfig | null
    if (config.main) {
      mainConfig = Private.normalizeAreaConfig(config.main, widgetSet)
    } else {
      mainConfig = null
    }
    const oldWidgets = this.widgets()
    const oldTabBars = this.tabBars()
    const oldHandles = this.handles()
    this._root = null
    for (const widget of oldWidgets) {
      if (!widgetSet.has(widget)) {
        widget.parent = null
      }
    }
    for (const tabBar of oldTabBars) {
      tabBar.dispose()
    }
    for (const handle of oldHandles) {
      if (handle.parentNode) {
        handle.parentNode.removeChild(handle)
      }
    }
    for (const widget of widgetSet) {
      widget.parent = this.parent
    }
    if (mainConfig) {
      this._root = Private.realizeAreaConfig(
        mainConfig,
        {
          createTabBar: (document?: Document | ShadowRoot) =>
            this._createTabBar(),
          createHandle: () => this._createHandle(),
        },
        this._document
      )
    } else {
      this._root = null
    }
    if (!this.parent) {
      return
    }
    widgetSet.forEach(widget => {
      this.attachWidget(widget)
    })
    this.parent.fit()
  }
  addWidget(widget: Widget, options: DockLayout.IAddOptions = {}): void {
    const ref = options.ref || null
    const mode = options.mode || "tab-after"
    let refNode: Private.TabLayoutNode | null = null
    if (this._root && ref) {
      refNode = this._root.findTabNode(ref)
    }
    if (ref && !refNode) {
      throw new Error("Reference widget is not in the layout.")
    }
    widget.parent = this.parent
    switch (mode) {
      case "tab-after":
        this._insertTab(widget, ref, refNode, true)
        break
      case "tab-before":
        this._insertTab(widget, ref, refNode, false)
        break
      case "split-top":
        this._insertSplit(widget, ref, refNode, "vertical", false)
        break
      case "split-left":
        this._insertSplit(widget, ref, refNode, "horizontal", false)
        break
      case "split-right":
        this._insertSplit(widget, ref, refNode, "horizontal", true)
        break
      case "split-bottom":
        this._insertSplit(widget, ref, refNode, "vertical", true)
        break
    }
    if (!this.parent) {
      return
    }
    this.attachWidget(widget)
    this.parent.fit()
  }
  removeWidget(widget: Widget): void {
    this._removeWidget(widget)
    if (!this.parent) {
      return
    }
    this.detachWidget(widget)
    this.parent.fit()
  }
  hitTestTabAreas(
    clientX: number,
    clientY: number
  ): DockLayout.ITabAreaGeometry | null {
    if (!this._root || !this.parent || !this.parent.isVisible) {
      return null
    }
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent.node)
    }
    const rect = this.parent.node.getBoundingClientRect()
    const x = clientX - rect.left - this._box.borderLeft
    const y = clientY - rect.top - this._box.borderTop
    const tabNode = this._root.hitTestTabNodes(x, y)
    if (!tabNode) {
      return null
    }
    const { tabBar, top, left, width, height } = tabNode
    const borderWidth = this._box.borderLeft + this._box.borderRight
    const borderHeight = this._box.borderTop + this._box.borderBottom
    const right = rect.width - borderWidth - (left + width)
    const bottom = rect.height - borderHeight - (top + height)
    return { tabBar, x, y, top, left, right, bottom, width, height }
  }
  protected init(): void {
    super.init()
    for (const widget of this) {
      this.attachWidget(widget)
    }
    for (const handle of this.handles()) {
      this.parent!.node.appendChild(handle)
    }
    this.parent!.fit()
  }
  protected attachWidget(widget: Widget): void {
    if (this.parent!.node === widget.node.parentNode) {
      return
    }
    this._items.set(widget, new LayoutItem(widget))
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach)
    }
    this.parent!.node.appendChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach)
    }
  }
  protected detachWidget(widget: Widget): void {
    if (this.parent!.node !== widget.node.parentNode) {
      return
    }
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach)
    }
    this.parent!.node.removeChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach)
    }
    const item = this._items.get(widget)
    if (item) {
      this._items.delete(widget)
      item.dispose()
    }
  }
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg)
    this.parent!.update()
  }
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg)
    this.parent!.fit()
  }
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height)
    }
  }
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1)
    }
  }
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit()
    }
  }
  private _removeWidget(widget: Widget): void {
    if (!this._root) {
      return
    }
    const tabNode = this._root.findTabNode(widget)
    if (!tabNode) {
      return
    }
    Private.removeAria(widget)
    if (tabNode.tabBar.titles.length > 1) {
      tabNode.tabBar.removeTab(widget.title)
      if (
        this._hiddenMode === Widget.HiddenMode.Scale &&
        tabNode.tabBar.titles.length == 1
      ) {
        const existingWidget = tabNode.tabBar.titles[0].owner
        existingWidget.hiddenMode = Widget.HiddenMode.Display
      }
      return
    }
    tabNode.tabBar.dispose()
    if (this._root === tabNode) {
      this._root = null
      return
    }
    this._root.holdAllSizes()
    const splitNode = tabNode.parent!
    tabNode.parent = null
    const i = ArrayExt.removeFirstOf(splitNode.children, tabNode)
    const handle = ArrayExt.removeAt(splitNode.handles, i)!
    ArrayExt.removeAt(splitNode.sizers, i)
    if (handle.parentNode) {
      handle.parentNode.removeChild(handle)
    }
    if (splitNode.children.length > 1) {
      splitNode.syncHandles()
      return
    }
    const maybeParent = splitNode.parent
    splitNode.parent = null
    const childNode = splitNode.children[0]
    const childHandle = splitNode.handles[0]
    splitNode.children.length = 0
    splitNode.handles.length = 0
    splitNode.sizers.length = 0
    if (childHandle.parentNode) {
      childHandle.parentNode.removeChild(childHandle)
    }
    if (this._root === splitNode) {
      childNode.parent = null
      this._root = childNode
      return
    }
    const parentNode = maybeParent!
    const j = parentNode.children.indexOf(splitNode)
    if (childNode instanceof Private.TabLayoutNode) {
      childNode.parent = parentNode
      parentNode.children[j] = childNode
      return
    }
    const splitHandle = ArrayExt.removeAt(parentNode.handles, j)!
    ArrayExt.removeAt(parentNode.children, j)
    ArrayExt.removeAt(parentNode.sizers, j)
    if (splitHandle.parentNode) {
      splitHandle.parentNode.removeChild(splitHandle)
    }
    for (let i = 0, n = childNode.children.length; i < n; ++i) {
      const gChild = childNode.children[i]
      const gHandle = childNode.handles[i]
      const gSizer = childNode.sizers[i]
      ArrayExt.insert(parentNode.children, j + i, gChild)
      ArrayExt.insert(parentNode.handles, j + i, gHandle)
      ArrayExt.insert(parentNode.sizers, j + i, gSizer)
      gChild.parent = parentNode
    }
    childNode.children.length = 0
    childNode.handles.length = 0
    childNode.sizers.length = 0
    childNode.parent = null
    parentNode.syncHandles()
  }
  private _insertTab(
    widget: Widget,
    ref: Widget | null,
    refNode: Private.TabLayoutNode | null,
    after: boolean
  ): void {
    if (widget === ref) {
      return
    }
    if (!this._root) {
      const tabNode = new Private.TabLayoutNode(this._createTabBar())
      tabNode.tabBar.addTab(widget.title)
      this._root = tabNode
      Private.addAria(widget, tabNode.tabBar)
      return
    }
    if (!refNode) {
      refNode = this._root.findFirstTabNode()!
    }
    if (refNode.tabBar.titles.indexOf(widget.title) === -1) {
      this._removeWidget(widget)
      widget.hide()
    }
    let index: number
    if (ref) {
      index = refNode.tabBar.titles.indexOf(ref.title)
    } else {
      index = refNode.tabBar.currentIndex
    }
    if (
      this._hiddenMode === Widget.HiddenMode.Scale &&
      refNode.tabBar.titles.length > 0
    ) {
      if (refNode.tabBar.titles.length == 1) {
        const existingWidget = refNode.tabBar.titles[0].owner
        existingWidget.hiddenMode = Widget.HiddenMode.Scale
      }
      widget.hiddenMode = Widget.HiddenMode.Scale
    } else {
      widget.hiddenMode = Widget.HiddenMode.Display
    }
    refNode.tabBar.insertTab(index + (after ? 1 : 0), widget.title)
    Private.addAria(widget, refNode.tabBar)
  }
  private _insertSplit(
    widget: Widget,
    ref: Widget | null,
    refNode: Private.TabLayoutNode | null,
    orientation: Private.Orientation,
    after: boolean
  ): void {
    if (widget === ref && refNode && refNode.tabBar.titles.length === 1) {
      return
    }
    this._removeWidget(widget)
    const tabNode = new Private.TabLayoutNode(this._createTabBar())
    tabNode.tabBar.addTab(widget.title)
    Private.addAria(widget, tabNode.tabBar)
    if (!this._root) {
      this._root = tabNode
      return
    }
    if (!refNode || !refNode.parent) {
      const root = this._splitRoot(orientation)
      const i = after ? root.children.length : 0
      root.normalizeSizes()
      const sizer = Private.createSizer(refNode ? 1 : Private.GOLDEN_RATIO)
      ArrayExt.insert(root.children, i, tabNode)
      ArrayExt.insert(root.sizers, i, sizer)
      ArrayExt.insert(root.handles, i, this._createHandle())
      tabNode.parent = root
      root.normalizeSizes()
      root.syncHandles()
      return
    }
    const splitNode = refNode.parent
    if (splitNode.orientation === orientation) {
      const i = splitNode.children.indexOf(refNode)
      splitNode.normalizeSizes()
      const s = (splitNode.sizers[i].sizeHint /= 2)
      const j = i + (after ? 1 : 0)
      ArrayExt.insert(splitNode.children, j, tabNode)
      ArrayExt.insert(splitNode.sizers, j, Private.createSizer(s))
      ArrayExt.insert(splitNode.handles, j, this._createHandle())
      tabNode.parent = splitNode
      splitNode.syncHandles()
      return
    }
    const i = ArrayExt.removeFirstOf(splitNode.children, refNode)
    const childNode = new Private.SplitLayoutNode(orientation)
    childNode.normalized = true
    childNode.children.push(refNode)
    childNode.sizers.push(Private.createSizer(0.5))
    childNode.handles.push(this._createHandle())
    refNode.parent = childNode
    const j = after ? 1 : 0
    ArrayExt.insert(childNode.children, j, tabNode)
    ArrayExt.insert(childNode.sizers, j, Private.createSizer(0.5))
    ArrayExt.insert(childNode.handles, j, this._createHandle())
    tabNode.parent = childNode
    childNode.syncHandles()
    ArrayExt.insert(splitNode.children, i, childNode)
    childNode.parent = splitNode
  }
  private _splitRoot(
    orientation: Private.Orientation
  ): Private.SplitLayoutNode {
    const oldRoot = this._root
    if (oldRoot instanceof Private.SplitLayoutNode) {
      if (oldRoot.orientation === orientation) {
        return oldRoot
      }
    }
    const newRoot = (this._root = new Private.SplitLayoutNode(orientation))
    if (oldRoot) {
      newRoot.children.push(oldRoot)
      newRoot.sizers.push(Private.createSizer(0))
      newRoot.handles.push(this._createHandle())
      oldRoot.parent = newRoot
    }
    return newRoot
  }
  private _fit(): void {
    let minW = 0
    let minH = 0
    if (this._root) {
      const limits = this._root.fit(this._spacing, this._items)
      minW = limits.minWidth
      minH = limits.minHeight
    }
    const box = (this._box = ElementExt.boxSizing(this.parent!.node))
    minW += box.horizontalSum
    minH += box.verticalSum
    const style = this.parent!.node.style
    style.minWidth = `${minW}px`
    style.minHeight = `${minH}px`
    this._dirty = true
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest)
    }
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest)
    }
  }
  private _update(offsetWidth: number, offsetHeight: number): void {
    this._dirty = false
    if (!this._root) {
      return
    }
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight
    }
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node)
    }
    const x = this._box.paddingTop
    const y = this._box.paddingLeft
    const width = offsetWidth - this._box.horizontalSum
    const height = offsetHeight - this._box.verticalSum
    this._root.update(x, y, width, height, this._spacing, this._items)
  }
  private _createTabBar(): TabBar<Widget> {
    const tabBar = this.renderer.createTabBar(this._document)
    tabBar.orientation = "horizontal"
    if (this.parent) {
      tabBar.parent = this.parent
      this.attachWidget(tabBar)
    }
    return tabBar
  }
  private _createHandle(): HTMLDivElement {
    const handle = this.renderer.createHandle()
    const style = handle.style
    style.position = "absolute"
    style.top = "0"
    style.left = "0"
    style.width = "0"
    style.height = "0"
    if (this.parent) {
      this.parent.node.appendChild(handle)
    }
    return handle
  }
  private _spacing = 4
  private _dirty = false
  private _root: Private.LayoutNode | null = null
  private _box: ElementExt.IBoxSizing | null = null
  private _document: Document | ShadowRoot
  private _hiddenMode: Widget.HiddenMode
  private _items: Private.ItemMap = new Map<Widget, LayoutItem>()
}
export namespace DockLayout {
  export interface IOptions {
    document?: Document | ShadowRoot
    hiddenMode?: Widget.HiddenMode
    renderer: IRenderer
    spacing?: number
  }
  export interface IRenderer {
    createTabBar(document?: Document | ShadowRoot): TabBar<Widget>
    createHandle(): HTMLDivElement
  }
  export type InsertMode =
    | "split-top"
    | "split-left"
    | "split-right"
    | "split-bottom"
    | "tab-before"
    | "tab-after"
  export interface IAddOptions {
    mode?: InsertMode
    ref?: Widget | null
  }
  export interface ITabAreaConfig {
    type: "tab-area"
    widgets: Widget[]
    currentIndex: number
  }
  export interface ISplitAreaConfig {
    type: "split-area"
    orientation: "horizontal" | "vertical"
    children: AreaConfig[]
    sizes: number[]
  }
  export type AreaConfig = ITabAreaConfig | ISplitAreaConfig
  export interface ILayoutConfig {
    main: AreaConfig | null
  }
  export interface ITabAreaGeometry {
    tabBar: TabBar<Widget>
    x: number
    y: number
    top: number
    left: number
    right: number
    bottom: number
    width: number
    height: number
  }
}
namespace Private {
  export const GOLDEN_RATIO = 0.618
  export type LayoutNode = TabLayoutNode | SplitLayoutNode
  export type Orientation = "horizontal" | "vertical"
  export type ItemMap = Map<Widget, LayoutItem>
  export function createSizer(hint: number): BoxSizer {
    const sizer = new BoxSizer()
    sizer.sizeHint = hint
    sizer.size = hint
    return sizer
  }
  export function normalizeAreaConfig(
    config: DockLayout.AreaConfig,
    widgetSet: Set<Widget>
  ): DockLayout.AreaConfig | null {
    let result: DockLayout.AreaConfig | null
    if (config.type === "tab-area") {
      result = normalizeTabAreaConfig(config, widgetSet)
    } else {
      result = normalizeSplitAreaConfig(config, widgetSet)
    }
    return result
  }
  export function realizeAreaConfig(
    config: DockLayout.AreaConfig,
    renderer: DockLayout.IRenderer,
    document: Document | ShadowRoot
  ): LayoutNode {
    let node: LayoutNode
    if (config.type === "tab-area") {
      node = realizeTabAreaConfig(config, renderer, document)
    } else {
      node = realizeSplitAreaConfig(config, renderer, document)
    }
    return node
  }
  export class TabLayoutNode {
    constructor(tabBar: TabBar<Widget>) {
      const tabSizer = new BoxSizer()
      const widgetSizer = new BoxSizer()
      tabSizer.stretch = 0
      widgetSizer.stretch = 1
      this.tabBar = tabBar
      this.sizers = [tabSizer, widgetSizer]
    }
    parent: SplitLayoutNode | null = null
    readonly tabBar: TabBar<Widget>
    readonly sizers: [BoxSizer, BoxSizer]
    get top(): number {
      return this._top
    }
    get left(): number {
      return this._left
    }
    get width(): number {
      return this._width
    }
    get height(): number {
      return this._height
    }
    *iterAllWidgets(): IterableIterator<Widget> {
      yield this.tabBar
      yield* this.iterUserWidgets()
    }
    *iterUserWidgets(): IterableIterator<Widget> {
      for (const title of this.tabBar.titles) {
        yield title.owner
      }
    }
    *iterSelectedWidgets(): IterableIterator<Widget> {
      const title = this.tabBar.currentTitle
      if (title) {
        yield title.owner
      }
    }
    *iterTabBars(): IterableIterator<TabBar<Widget>> {
      yield this.tabBar
    }
    *iterHandles(): IterableIterator<HTMLDivElement> {
      return
    }
    findTabNode(widget: Widget): TabLayoutNode | null {
      return this.tabBar.titles.indexOf(widget.title) !== -1 ? this : null
    }
    findSplitNode(
      handle: HTMLDivElement
    ): { index: number; node: SplitLayoutNode } | null {
      return null
    }
    findFirstTabNode(): TabLayoutNode | null {
      return this
    }
    hitTestTabNodes(x: number, y: number): TabLayoutNode | null {
      if (x < this._left || x >= this._left + this._width) {
        return null
      }
      if (y < this._top || y >= this._top + this._height) {
        return null
      }
      return this
    }
    createConfig(): DockLayout.ITabAreaConfig {
      const widgets = this.tabBar.titles.map(title => title.owner)
      const currentIndex = this.tabBar.currentIndex
      return { type: "tab-area", widgets, currentIndex }
    }
    holdAllSizes(): void {
      return
    }
    fit(spacing: number, items: ItemMap): ElementExt.ISizeLimits {
      let minWidth = 0
      let minHeight = 0
      const maxWidth = Infinity
      const maxHeight = Infinity
      const tabBarItem = items.get(this.tabBar)
      const current = this.tabBar.currentTitle
      const widgetItem = current ? items.get(current.owner) : undefined
      const [tabBarSizer, widgetSizer] = this.sizers
      if (tabBarItem) {
        tabBarItem.fit()
      }
      if (widgetItem) {
        widgetItem.fit()
      }
      if (tabBarItem && !tabBarItem.isHidden) {
        minWidth = Math.max(minWidth, tabBarItem.minWidth)
        minHeight += tabBarItem.minHeight
        tabBarSizer.minSize = tabBarItem.minHeight
        tabBarSizer.maxSize = tabBarItem.maxHeight
      } else {
        tabBarSizer.minSize = 0
        tabBarSizer.maxSize = 0
      }
      if (widgetItem && !widgetItem.isHidden) {
        minWidth = Math.max(minWidth, widgetItem.minWidth)
        minHeight += widgetItem.minHeight
        widgetSizer.minSize = widgetItem.minHeight
        widgetSizer.maxSize = Infinity
      } else {
        widgetSizer.minSize = 0
        widgetSizer.maxSize = Infinity
      }
      return { minWidth, minHeight, maxWidth, maxHeight }
    }
    update(
      left: number,
      top: number,
      width: number,
      height: number,
      spacing: number,
      items: ItemMap
    ): void {
      this._top = top
      this._left = left
      this._width = width
      this._height = height
      const tabBarItem = items.get(this.tabBar)
      const current = this.tabBar.currentTitle
      const widgetItem = current ? items.get(current.owner) : undefined
      BoxEngine.calc(this.sizers, height)
      if (tabBarItem && !tabBarItem.isHidden) {
        const size = this.sizers[0].size
        tabBarItem.update(left, top, width, size)
        top += size
      }
      if (widgetItem && !widgetItem.isHidden) {
        const size = this.sizers[1].size
        widgetItem.update(left, top, width, size)
      }
    }
    private _top = 0
    private _left = 0
    private _width = 0
    private _height = 0
  }
  export class SplitLayoutNode {
    constructor(orientation: Orientation) {
      this.orientation = orientation
    }
    parent: SplitLayoutNode | null = null
    normalized = false
    readonly orientation: Orientation
    readonly children: LayoutNode[] = []
    readonly sizers: BoxSizer[] = []
    readonly handles: HTMLDivElement[] = [];
    *iterAllWidgets(): IterableIterator<Widget> {
      for (const child of this.children) {
        yield* child.iterAllWidgets()
      }
    }
    *iterUserWidgets(): IterableIterator<Widget> {
      for (const child of this.children) {
        yield* child.iterUserWidgets()
      }
    }
    *iterSelectedWidgets(): IterableIterator<Widget> {
      for (const child of this.children) {
        yield* child.iterSelectedWidgets()
      }
    }
    *iterTabBars(): IterableIterator<TabBar<Widget>> {
      for (const child of this.children) {
        yield* child.iterTabBars()
      }
    }
    *iterHandles(): IterableIterator<HTMLDivElement> {
      for (const child of this.children) {
        yield* child.iterHandles()
      }
    }
    findTabNode(widget: Widget): TabLayoutNode | null {
      for (let i = 0, n = this.children.length; i < n; ++i) {
        const result = this.children[i].findTabNode(widget)
        if (result) {
          return result
        }
      }
      return null
    }
    findSplitNode(
      handle: HTMLDivElement
    ): { index: number; node: SplitLayoutNode } | null {
      const index = this.handles.indexOf(handle)
      if (index !== -1) {
        return { index, node: this }
      }
      for (let i = 0, n = this.children.length; i < n; ++i) {
        const result = this.children[i].findSplitNode(handle)
        if (result) {
          return result
        }
      }
      return null
    }
    findFirstTabNode(): TabLayoutNode | null {
      if (this.children.length === 0) {
        return null
      }
      return this.children[0].findFirstTabNode()
    }
    hitTestTabNodes(x: number, y: number): TabLayoutNode | null {
      for (let i = 0, n = this.children.length; i < n; ++i) {
        const result = this.children[i].hitTestTabNodes(x, y)
        if (result) {
          return result
        }
      }
      return null
    }
    createConfig(): DockLayout.ISplitAreaConfig {
      const orientation = this.orientation
      const sizes = this.createNormalizedSizes()
      const children = this.children.map(child => child.createConfig())
      return { type: "split-area", orientation, children, sizes }
    }
    syncHandles(): void {
      this.handles.forEach((handle, i) => {
        handle.setAttribute("data-orientation", this.orientation)
        if (i === this.handles.length - 1) {
          handle.classList.add("lm-mod-hidden")
        } else {
          handle.classList.remove("lm-mod-hidden")
        }
      })
    }
    holdSizes(): void {
      for (const sizer of this.sizers) {
        sizer.sizeHint = sizer.size
      }
    }
    holdAllSizes(): void {
      for (const child of this.children) {
        child.holdAllSizes()
      }
      this.holdSizes()
    }
    normalizeSizes(): void {
      const n = this.sizers.length
      if (n === 0) {
        return
      }
      this.holdSizes()
      const sum = this.sizers.reduce((v, sizer) => v + sizer.sizeHint, 0)
      if (sum === 0) {
        for (const sizer of this.sizers) {
          sizer.size = sizer.sizeHint = 1 / n
        }
      } else {
        for (const sizer of this.sizers) {
          sizer.size = sizer.sizeHint /= sum
        }
      }
      this.normalized = true
    }
    createNormalizedSizes(): number[] {
      const n = this.sizers.length
      if (n === 0) {
        return []
      }
      const sizes = this.sizers.map(sizer => sizer.size)
      const sum = sizes.reduce((v, size) => v + size, 0)
      if (sum === 0) {
        for (let i = sizes.length - 1; i > -1; i--) {
          sizes[i] = 1 / n
        }
      } else {
        for (let i = sizes.length - 1; i > -1; i--) {
          sizes[i] /= sum
        }
      }
      return sizes
    }
    fit(spacing: number, items: ItemMap): ElementExt.ISizeLimits {
      const horizontal = this.orientation === "horizontal"
      const fixed = Math.max(0, this.children.length - 1) * spacing
      let minWidth = horizontal ? fixed : 0
      let minHeight = horizontal ? 0 : fixed
      const maxWidth = Infinity
      const maxHeight = Infinity
      for (let i = 0, n = this.children.length; i < n; ++i) {
        const limits = this.children[i].fit(spacing, items)
        if (horizontal) {
          minHeight = Math.max(minHeight, limits.minHeight)
          minWidth += limits.minWidth
          this.sizers[i].minSize = limits.minWidth
        } else {
          minWidth = Math.max(minWidth, limits.minWidth)
          minHeight += limits.minHeight
          this.sizers[i].minSize = limits.minHeight
        }
      }
      return { minWidth, minHeight, maxWidth, maxHeight }
    }
    update(
      left: number,
      top: number,
      width: number,
      height: number,
      spacing: number,
      items: ItemMap
    ): void {
      const horizontal = this.orientation === "horizontal"
      const fixed = Math.max(0, this.children.length - 1) * spacing
      const space = Math.max(0, (horizontal ? width : height) - fixed)
      if (this.normalized) {
        for (const sizer of this.sizers) {
          sizer.sizeHint *= space
        }
        this.normalized = false
      }
      BoxEngine.calc(this.sizers, space)
      for (let i = 0, n = this.children.length; i < n; ++i) {
        const child = this.children[i]
        const size = this.sizers[i].size
        const handleStyle = this.handles[i].style
        if (horizontal) {
          child.update(left, top, size, height, spacing, items)
          left += size
          handleStyle.top = `${top}px`
          handleStyle.left = `${left}px`
          handleStyle.width = `${spacing}px`
          handleStyle.height = `${height}px`
          left += spacing
        } else {
          child.update(left, top, width, size, spacing, items)
          top += size
          handleStyle.top = `${top}px`
          handleStyle.left = `${left}px`
          handleStyle.width = `${width}px`
          handleStyle.height = `${spacing}px`
          top += spacing
        }
      }
    }
  }
  export function addAria(widget: Widget, tabBar: TabBar<Widget>): void {
    widget.node.setAttribute("role", "tabpanel")
    const renderer = tabBar.renderer
    if (renderer instanceof TabBar.Renderer) {
      const tabId = renderer.createTabKey({
        title: widget.title,
        current: false,
        zIndex: 0,
      })
      widget.node.setAttribute("aria-labelledby", tabId)
    }
  }
  export function removeAria(widget: Widget): void {
    widget.node.removeAttribute("role")
    widget.node.removeAttribute("aria-labelledby")
  }
  function normalizeTabAreaConfig(
    config: DockLayout.ITabAreaConfig,
    widgetSet: Set<Widget>
  ): DockLayout.ITabAreaConfig | null {
    if (config.widgets.length === 0) {
      return null
    }
    const widgets: Widget[] = []
    for (const widget of config.widgets) {
      if (!widgetSet.has(widget)) {
        widgetSet.add(widget)
        widgets.push(widget)
      }
    }
    if (widgets.length === 0) {
      return null
    }
    let index = config.currentIndex
    if (index !== -1 && (index < 0 || index >= widgets.length)) {
      index = 0
    }
    return { type: "tab-area", widgets, currentIndex: index }
  }
  function normalizeSplitAreaConfig(
    config: DockLayout.ISplitAreaConfig,
    widgetSet: Set<Widget>
  ): DockLayout.AreaConfig | null {
    const orientation = config.orientation
    const children: DockLayout.AreaConfig[] = []
    const sizes: number[] = []
    for (let i = 0, n = config.children.length; i < n; ++i) {
      const child = normalizeAreaConfig(config.children[i], widgetSet)
      if (!child) {
        continue
      }
      if (child.type === "tab-area" || child.orientation !== orientation) {
        children.push(child)
        sizes.push(Math.abs(config.sizes[i] || 0))
      } else {
        children.push(...child.children)
        sizes.push(...child.sizes)
      }
    }
    if (children.length === 0) {
      return null
    }
    if (children.length === 1) {
      return children[0]
    }
    return { type: "split-area", orientation, children, sizes }
  }
  function realizeTabAreaConfig(
    config: DockLayout.ITabAreaConfig,
    renderer: DockLayout.IRenderer,
    document: Document | ShadowRoot
  ): TabLayoutNode {
    const tabBar = renderer.createTabBar(document)
    for (const widget of config.widgets) {
      widget.hide()
      tabBar.addTab(widget.title)
      Private.addAria(widget, tabBar)
    }
    tabBar.currentIndex = config.currentIndex
    return new TabLayoutNode(tabBar)
  }
  function realizeSplitAreaConfig(
    config: DockLayout.ISplitAreaConfig,
    renderer: DockLayout.IRenderer,
    document: Document | ShadowRoot
  ): SplitLayoutNode {
    const node = new SplitLayoutNode(config.orientation)
    config.children.forEach((child, i) => {
      const childNode = realizeAreaConfig(child, renderer, document)
      const sizer = createSizer(config.sizes[i])
      const handle = renderer.createHandle()
      node.children.push(childNode)
      node.handles.push(handle)
      node.sizers.push(sizer)
      childNode.parent = node
    })
    node.syncHandles()
    node.normalizeSizes()
    return node
  }
}
export class DockPanel extends Widget {
  constructor(options: DockPanel.IOptions = {}) {
    super()
    this.addClass("lm-DockPanel")
    this._document = options.document || document
    this._mode = options.mode || "multiple-document"
    this._renderer = options.renderer || DockPanel.defaultRenderer
    this._edges = options.edges || Private.DEFAULT_EDGES
    if (options.tabsMovable !== undefined) {
      this._tabsMovable = options.tabsMovable
    }
    if (options.tabsConstrained !== undefined) {
      this._tabsConstrained = options.tabsConstrained
    }
    if (options.addButtonEnabled !== undefined) {
      this._addButtonEnabled = options.addButtonEnabled
    }
    this.dataset["mode"] = this._mode
    const renderer: DockPanel.IRenderer = {
      createTabBar: () => this._createTabBar(),
      createHandle: () => this._createHandle(),
    }
    this.layout = new DockLayout({
      document: this._document,
      renderer,
      spacing: options.spacing,
      hiddenMode: options.hiddenMode,
    })
    this.overlay = options.overlay || new DockPanel.Overlay()
    this.node.appendChild(this.overlay.node)
  }
  dispose(): void {
    this._releaseMouse()
    this.overlay.hide(0)
    if (this._drag) {
      this._drag.dispose()
    }
    super.dispose()
  }
  get hiddenMode(): Widget.HiddenMode {
    return (this.layout as DockLayout).hiddenMode
  }
  set hiddenMode(v: Widget.HiddenMode) {
    ;(this.layout as DockLayout).hiddenMode = v
  }
  get layoutModified(): ISignal<this, void> {
    return this._layoutModified
  }
  get addRequested(): ISignal<this, TabBar<Widget>> {
    return this._addRequested
  }
  readonly overlay: DockPanel.IOverlay
  get renderer(): DockPanel.IRenderer {
    return (this.layout as DockLayout).renderer
  }
  get spacing(): number {
    return (this.layout as DockLayout).spacing
  }
  set spacing(value: number) {
    ;(this.layout as DockLayout).spacing = value
  }
  get mode(): DockPanel.Mode {
    return this._mode
  }
  set mode(value: DockPanel.Mode) {
    if (this._mode === value) {
      return
    }
    this._mode = value
    this.dataset["mode"] = value
    const layout = this.layout as DockLayout
    switch (value) {
      case "multiple-document":
        for (const tabBar of layout.tabBars()) {
          tabBar.show()
        }
        break
      case "single-document":
        layout.restoreLayout(Private.createSingleDocumentConfig(this))
        break
      default:
        throw "unreachable"
    }
    MessageLoop.postMessage(this, Private.LayoutModified)
  }
  get tabsMovable(): boolean {
    return this._tabsMovable
  }
  set tabsMovable(value: boolean) {
    this._tabsMovable = value
    for (const tabBar of this.tabBars()) {
      tabBar.tabsMovable = value
    }
  }
  get tabsConstrained(): boolean {
    return this._tabsConstrained
  }
  set tabsConstrained(value: boolean) {
    this._tabsConstrained = value
  }
  get addButtonEnabled(): boolean {
    return this._addButtonEnabled
  }
  set addButtonEnabled(value: boolean) {
    this._addButtonEnabled = value
    for (const tabBar of this.tabBars()) {
      tabBar.addButtonEnabled = value
    }
  }
  get isEmpty(): boolean {
    return (this.layout as DockLayout).isEmpty
  }
  *widgets(): IterableIterator<Widget> {
    yield* (this.layout as DockLayout).widgets()
  }
  *selectedWidgets(): IterableIterator<Widget> {
    yield* (this.layout as DockLayout).selectedWidgets()
  }
  *tabBars(): IterableIterator<TabBar<Widget>> {
    yield* (this.layout as DockLayout).tabBars()
  }
  *handles(): IterableIterator<HTMLDivElement> {
    yield* (this.layout as DockLayout).handles()
  }
  selectWidget(widget: Widget): void {
    const tabBar = find(this.tabBars(), bar => {
      return bar.titles.indexOf(widget.title) !== -1
    })
    if (!tabBar) {
      throw new Error("Widget is not contained in the dock panel.")
    }
    tabBar.currentTitle = widget.title
  }
  activateWidget(widget: Widget): void {
    this.selectWidget(widget)
    widget.activate()
  }
  saveLayout(): DockPanel.ILayoutConfig {
    return (this.layout as DockLayout).saveLayout()
  }
  restoreLayout(config: DockPanel.ILayoutConfig): void {
    this._mode = "multiple-document"
    ;(this.layout as DockLayout).restoreLayout(config)
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush()
    }
    MessageLoop.postMessage(this, Private.LayoutModified)
  }
  addWidget(widget: Widget, options: DockPanel.IAddOptions = {}): void {
    if (this._mode === "single-document") {
      ;(this.layout as DockLayout).addWidget(widget)
    } else {
      ;(this.layout as DockLayout).addWidget(widget, options)
    }
    MessageLoop.postMessage(this, Private.LayoutModified)
  }
  processMessage(msg: Message): void {
    if (msg.type === "layout-modified") {
      this._layoutModified.emit(undefined)
    } else {
      super.processMessage(msg)
    }
  }
  handleEvent(event: Event): void {
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
      case "pointerdown":
        this._evtPointerDown(event as MouseEvent)
        break
      case "pointermove":
        this._evtPointerMove(event as MouseEvent)
        break
      case "pointerup":
        this._evtPointerUp(event as MouseEvent)
        break
      case "keydown":
        this._evtKeyDown(event as KeyboardEvent)
        break
      case "contextmenu":
        event.preventDefault()
        event.stopPropagation()
        break
    }
  }
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener("lm-dragenter", this)
    this.node.addEventListener("lm-dragleave", this)
    this.node.addEventListener("lm-dragover", this)
    this.node.addEventListener("lm-drop", this)
    this.node.addEventListener("pointerdown", this)
  }
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener("lm-dragenter", this)
    this.node.removeEventListener("lm-dragleave", this)
    this.node.removeEventListener("lm-dragover", this)
    this.node.removeEventListener("lm-drop", this)
    this.node.removeEventListener("pointerdown", this)
    this._releaseMouse()
  }
  protected onChildAdded(msg: Widget.ChildMessage): void {
    if (Private.isGeneratedTabBarProperty.get(msg.child)) {
      return
    }
    msg.child.addClass("lm-DockPanel-widget")
  }
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    if (Private.isGeneratedTabBarProperty.get(msg.child)) {
      return
    }
    msg.child.removeClass("lm-DockPanel-widget")
    MessageLoop.postMessage(this, Private.LayoutModified)
  }
  private _evtDragEnter(event: Drag.Event): void {
    if (event.mimeData.hasData("application/vnd.lumino.widget-factory")) {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  private _evtDragLeave(event: Drag.Event): void {
    event.preventDefault()
    event.stopPropagation()
    this.overlay.hide(1)
  }
  private _evtDragOver(event: Drag.Event): void {
    event.preventDefault()
    event.stopPropagation()
    if (
      (this._tabsConstrained && event.source !== this) ||
      this._showOverlay(event.clientX, event.clientY) === "invalid"
    ) {
      event.dropAction = "none"
    } else {
      event.dropAction = event.proposedAction
    }
  }
  private _evtDrop(event: Drag.Event): void {
    event.preventDefault()
    event.stopPropagation()
    this.overlay.hide(0)
    if (event.proposedAction === "none") {
      event.dropAction = "none"
      return
    }
    const { clientX, clientY } = event
    const { zone, target } = Private.findDropTarget(
      this,
      clientX,
      clientY,
      this._edges
    )
    if (zone === "invalid") {
      event.dropAction = "none"
      return
    }
    const mimeData = event.mimeData
    const factory = mimeData.getData("application/vnd.lumino.widget-factory")
    if (typeof factory !== "function") {
      event.dropAction = "none"
      return
    }
    const widget = factory()
    if (!(widget instanceof Widget)) {
      event.dropAction = "none"
      return
    }
    if (widget.contains(this)) {
      event.dropAction = "none"
      return
    }
    const ref = target ? Private.getDropRef(target.tabBar) : null
    switch (zone) {
      case "root-all":
        this.addWidget(widget)
        break
      case "root-top":
        this.addWidget(widget, { mode: "split-top" })
        break
      case "root-left":
        this.addWidget(widget, { mode: "split-left" })
        break
      case "root-right":
        this.addWidget(widget, { mode: "split-right" })
        break
      case "root-bottom":
        this.addWidget(widget, { mode: "split-bottom" })
        break
      case "widget-all":
        this.addWidget(widget, { mode: "tab-after", ref })
        break
      case "widget-top":
        this.addWidget(widget, { mode: "split-top", ref })
        break
      case "widget-left":
        this.addWidget(widget, { mode: "split-left", ref })
        break
      case "widget-right":
        this.addWidget(widget, { mode: "split-right", ref })
        break
      case "widget-bottom":
        this.addWidget(widget, { mode: "split-bottom", ref })
        break
      case "widget-tab":
        this.addWidget(widget, { mode: "tab-after", ref })
        break
      default:
        throw "unreachable"
    }
    event.dropAction = event.proposedAction
    this.activateWidget(widget)
  }
  private _evtKeyDown(event: KeyboardEvent): void {
    event.preventDefault()
    event.stopPropagation()
    if (event.keyCode === 27) {
      this._releaseMouse()
      MessageLoop.postMessage(this, Private.LayoutModified)
    }
  }
  private _evtPointerDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    const layout = this.layout as DockLayout
    const target = event.target as HTMLElement
    const handle = find(layout.handles(), handle => handle.contains(target))
    if (!handle) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this._document.addEventListener("keydown", this, true)
    this._document.addEventListener("pointerup", this, true)
    this._document.addEventListener("pointermove", this, true)
    this._document.addEventListener("contextmenu", this, true)
    const rect = handle.getBoundingClientRect()
    const deltaX = event.clientX - rect.left
    const deltaY = event.clientY - rect.top
    const style = window.getComputedStyle(handle)
    const override = Drag.overrideCursor(style.cursor!, this._document)
    this._pressData = { handle, deltaX, deltaY, override }
  }
  private _evtPointerMove(event: MouseEvent): void {
    if (!this._pressData) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const rect = this.node.getBoundingClientRect()
    const xPos = event.clientX - rect.left - this._pressData.deltaX
    const yPos = event.clientY - rect.top - this._pressData.deltaY
    const layout = this.layout as DockLayout
    layout.moveHandle(this._pressData.handle, xPos, yPos)
  }
  private _evtPointerUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this._releaseMouse()
    MessageLoop.postMessage(this, Private.LayoutModified)
  }
  private _releaseMouse(): void {
    if (!this._pressData) {
      return
    }
    this._pressData.override.dispose()
    this._pressData = null
    this._document.removeEventListener("keydown", this, true)
    this._document.removeEventListener("pointerup", this, true)
    this._document.removeEventListener("pointermove", this, true)
    this._document.removeEventListener("contextmenu", this, true)
  }
  private _showOverlay(clientX: number, clientY: number): Private.DropZone {
    const { zone, target } = Private.findDropTarget(
      this,
      clientX,
      clientY,
      this._edges
    )
    if (zone === "invalid") {
      this.overlay.hide(100)
      return zone
    }
    let top: number
    let left: number
    let right: number
    let bottom: number
    const box = ElementExt.boxSizing(this.node) // TODO cache this?
    const rect = this.node.getBoundingClientRect()
    switch (zone) {
      case "root-all":
        top = box.paddingTop
        left = box.paddingLeft
        right = box.paddingRight
        bottom = box.paddingBottom
        break
      case "root-top":
        top = box.paddingTop
        left = box.paddingLeft
        right = box.paddingRight
        bottom = rect.height * Private.GOLDEN_RATIO
        break
      case "root-left":
        top = box.paddingTop
        left = box.paddingLeft
        right = rect.width * Private.GOLDEN_RATIO
        bottom = box.paddingBottom
        break
      case "root-right":
        top = box.paddingTop
        left = rect.width * Private.GOLDEN_RATIO
        right = box.paddingRight
        bottom = box.paddingBottom
        break
      case "root-bottom":
        top = rect.height * Private.GOLDEN_RATIO
        left = box.paddingLeft
        right = box.paddingRight
        bottom = box.paddingBottom
        break
      case "widget-all":
        top = target!.top
        left = target!.left
        right = target!.right
        bottom = target!.bottom
        break
      case "widget-top":
        top = target!.top
        left = target!.left
        right = target!.right
        bottom = target!.bottom + target!.height / 2
        break
      case "widget-left":
        top = target!.top
        left = target!.left
        right = target!.right + target!.width / 2
        bottom = target!.bottom
        break
      case "widget-right":
        top = target!.top
        left = target!.left + target!.width / 2
        right = target!.right
        bottom = target!.bottom
        break
      case "widget-bottom":
        top = target!.top + target!.height / 2
        left = target!.left
        right = target!.right
        bottom = target!.bottom
        break
      case "widget-tab": {
        const tabHeight = target!.tabBar.node.getBoundingClientRect().height
        top = target!.top
        left = target!.left
        right = target!.right
        bottom = target!.bottom + target!.height - tabHeight
        break
      }
      default:
        throw "unreachable"
    }
    this.overlay.show({ top, left, right, bottom })
    return zone
  }
  private _createTabBar(): TabBar<Widget> {
    const tabBar = this._renderer.createTabBar(this._document)
    Private.isGeneratedTabBarProperty.set(tabBar, true)
    if (this._mode === "single-document") {
      tabBar.hide()
    }
    tabBar.tabsMovable = this._tabsMovable
    tabBar.allowDeselect = false
    tabBar.addButtonEnabled = this._addButtonEnabled
    tabBar.removeBehavior = "select-previous-tab"
    tabBar.insertBehavior = "select-tab-if-needed"
    tabBar.tabMoved.connect(this._onTabMoved, this)
    tabBar.currentChanged.connect(this._onCurrentChanged, this)
    tabBar.tabCloseRequested.connect(this._onTabCloseRequested, this)
    tabBar.tabDetachRequested.connect(this._onTabDetachRequested, this)
    tabBar.tabActivateRequested.connect(this._onTabActivateRequested, this)
    tabBar.addRequested.connect(this._onTabAddRequested, this)
    return tabBar
  }
  private _createHandle(): HTMLDivElement {
    return this._renderer.createHandle()
  }
  private _onTabMoved(): void {
    MessageLoop.postMessage(this, Private.LayoutModified)
  }
  private _onCurrentChanged(
    sender: TabBar<Widget>,
    args: TabBar.ICurrentChangedArgs<Widget>
  ): void {
    const { previousTitle, currentTitle } = args
    if (previousTitle) {
      previousTitle.owner.hide()
    }
    if (currentTitle) {
      currentTitle.owner.show()
    }
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush()
    }
    MessageLoop.postMessage(this, Private.LayoutModified)
  }
  private _onTabAddRequested(sender: TabBar<Widget>): void {
    this._addRequested.emit(sender)
  }
  private _onTabActivateRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabActivateRequestedArgs<Widget>
  ): void {
    args.title.owner.activate()
  }
  private _onTabCloseRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabCloseRequestedArgs<Widget>
  ): void {
    args.title.owner.close()
  }
  private _onTabDetachRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabDetachRequestedArgs<Widget>
  ): void {
    if (this._drag) {
      return
    }
    sender.releaseMouse()
    const { title, tab, clientX, clientY } = args
    const mimeData = new MimeData()
    const factory = () => title.owner
    mimeData.setData("application/vnd.lumino.widget-factory", factory)
    const dragImage = tab.cloneNode(true) as HTMLElement
    this._drag = new Drag({
      document: this._document,
      mimeData,
      dragImage,
      proposedAction: "move",
      supportedActions: "move",
      source: this,
    })
    tab.classList.add("lm-mod-hidden")
    const cleanup = () => {
      this._drag = null
      tab.classList.remove("lm-mod-hidden")
    }
    this._drag.start(clientX, clientY).then(cleanup)
  }
  private _edges: DockPanel.IEdges
  private _document: Document | ShadowRoot
  private _mode: DockPanel.Mode
  private _drag: Drag | null = null
  private _renderer: DockPanel.IRenderer
  private _tabsMovable: boolean = true
  private _tabsConstrained: boolean = false
  private _addButtonEnabled: boolean = false
  private _pressData: Private.IPressData | null = null
  private _layoutModified = new Signal<this, void>(this)
  private _addRequested = new Signal<this, TabBar<Widget>>(this)
}
export namespace DockPanel {
  export interface IOptions {
    document?: Document | ShadowRoot
    overlay?: IOverlay
    renderer?: IRenderer
    spacing?: number
    mode?: DockPanel.Mode
    edges?: IEdges
    hiddenMode?: Widget.HiddenMode
    tabsMovable?: boolean
    tabsConstrained?: boolean
    addButtonEnabled?: boolean
  }
  export interface IEdges {
    top: number
    right: number
    bottom: number
    left: number
  }
  export type Mode = "single-document" | "multiple-document"
  export type ILayoutConfig = DockLayout.ILayoutConfig
  export type InsertMode = DockLayout.InsertMode
  export type IAddOptions = DockLayout.IAddOptions
  export interface IOverlayGeometry {
    top: number
    left: number
    right: number
    bottom: number
  }
  export interface IOverlay {
    readonly node: HTMLDivElement
    show(geo: IOverlayGeometry): void
    hide(delay: number): void
  }
  export class Overlay implements IOverlay {
    constructor() {
      this.node = document.createElement("div")
      this.node.classList.add("lm-DockPanel-overlay")
      this.node.classList.add("lm-mod-hidden")
      this.node.style.position = "absolute"
    }
    readonly node: HTMLDivElement
    show(geo: IOverlayGeometry): void {
      const style = this.node.style
      style.top = `${geo.top}px`
      style.left = `${geo.left}px`
      style.right = `${geo.right}px`
      style.bottom = `${geo.bottom}px`
      clearTimeout(this._timer)
      this._timer = -1
      if (!this._hidden) {
        return
      }
      this._hidden = false
      this.node.classList.remove("lm-mod-hidden")
    }
    hide(delay: number): void {
      if (this._hidden) {
        return
      }
      if (delay <= 0) {
        clearTimeout(this._timer)
        this._timer = -1
        this._hidden = true
        this.node.classList.add("lm-mod-hidden")
        return
      }
      if (this._timer !== -1) {
        return
      }
      this._timer = window.setTimeout(() => {
        this._timer = -1
        this._hidden = true
        this.node.classList.add("lm-mod-hidden")
      }, delay)
    }
    private _timer = -1
    private _hidden = true
  }
  export type IRenderer = DockLayout.IRenderer
  export class Renderer implements IRenderer {
    createTabBar(document?: Document | ShadowRoot): TabBar<Widget> {
      const bar = new TabBar<Widget>({ document })
      bar.addClass("lm-DockPanel-tabBar")
      return bar
    }
    createHandle(): HTMLDivElement {
      const handle = document.createElement("div")
      handle.className = "lm-DockPanel-handle"
      return handle
    }
  }
  export const defaultRenderer = new Renderer()
}
namespace Private {
  export const GOLDEN_RATIO = 0.618
  export const DEFAULT_EDGES = {
    top: 12,
    right: 40,
    bottom: 40,
    left: 40,
  }
  export const LayoutModified = new ConflatableMessage("layout-modified")
  export interface IPressData {
    handle: HTMLDivElement
    deltaX: number
    deltaY: number
    override: IDisposable
  }
  export type DropZone =
    | "invalid"
    | "root-all"
    | "root-top"
    | "root-left"
    | "root-right"
    | "root-bottom"
    | "widget-all"
    | "widget-top"
    | "widget-left"
    | "widget-right"
    | "widget-bottom"
    | "widget-tab"
  export interface IDropTarget {
    zone: DropZone
    target: DockLayout.ITabAreaGeometry | null
  }
  export const isGeneratedTabBarProperty = new AttachedProperty<
    Widget,
    boolean
  >({
    name: "isGeneratedTabBar",
    create: () => false,
  })
  export function createSingleDocumentConfig(
    panel: DockPanel
  ): DockPanel.ILayoutConfig {
    if (panel.isEmpty) {
      return { main: null }
    }
    const widgets = Array.from(panel.widgets())
    const selected = panel.selectedWidgets().next().value
    const currentIndex = selected ? widgets.indexOf(selected) : -1
    return { main: { type: "tab-area", widgets, currentIndex } }
  }
  export function findDropTarget(
    panel: DockPanel,
    clientX: number,
    clientY: number,
    edges: DockPanel.IEdges
  ): IDropTarget {
    if (!ElementExt.hitTest(panel.node, clientX, clientY)) {
      return { zone: "invalid", target: null }
    }
    const layout = panel.layout as DockLayout
    if (layout.isEmpty) {
      return { zone: "root-all", target: null }
    }
    if (panel.mode === "multiple-document") {
      const panelRect = panel.node.getBoundingClientRect()
      const pl = clientX - panelRect.left + 1
      const pt = clientY - panelRect.top + 1
      const pr = panelRect.right - clientX
      const pb = panelRect.bottom - clientY
      const pd = Math.min(pt, pr, pb, pl)
      switch (pd) {
        case pt:
          if (pt < edges.top) {
            return { zone: "root-top", target: null }
          }
          break
        case pr:
          if (pr < edges.right) {
            return { zone: "root-right", target: null }
          }
          break
        case pb:
          if (pb < edges.bottom) {
            return { zone: "root-bottom", target: null }
          }
          break
        case pl:
          if (pl < edges.left) {
            return { zone: "root-left", target: null }
          }
          break
        default:
          throw "unreachable"
      }
    }
    const target = layout.hitTestTabAreas(clientX, clientY)
    if (!target) {
      return { zone: "invalid", target: null }
    }
    if (panel.mode === "single-document") {
      return { zone: "widget-all", target }
    }
    let al = target.x - target.left + 1
    let at = target.y - target.top + 1
    let ar = target.left + target.width - target.x
    let ab = target.top + target.height - target.y
    const tabHeight = target.tabBar.node.getBoundingClientRect().height
    if (at < tabHeight) {
      return { zone: "widget-tab", target }
    }
    const rx = Math.round(target.width / 3)
    const ry = Math.round(target.height / 3)
    if (al > rx && ar > rx && at > ry && ab > ry) {
      return { zone: "widget-all", target }
    }
    al /= rx
    at /= ry
    ar /= rx
    ab /= ry
    const ad = Math.min(al, at, ar, ab)
    let zone: DropZone
    switch (ad) {
      case al:
        zone = "widget-left"
        break
      case at:
        zone = "widget-top"
        break
      case ar:
        zone = "widget-right"
        break
      case ab:
        zone = "widget-bottom"
        break
      default:
        throw "unreachable"
    }
    return { zone, target }
  }
  export function getDropRef(tabBar: TabBar<Widget>): Widget | null {
    if (tabBar.titles.length === 0) {
      return null
    }
    if (tabBar.currentTitle) {
      return tabBar.currentTitle.owner
    }
    return tabBar.titles[tabBar.titles.length - 1].owner
  }
}
export class FocusTracker<T extends Widget> implements IDisposable {
  dispose(): void {
    if (this._counter < 0) {
      return
    }
    this._counter = -1
    Signal.clearData(this)
    for (const widget of this._widgets) {
      widget.node.removeEventListener("focus", this, true)
      widget.node.removeEventListener("blur", this, true)
    }
    this._activeWidget = null
    this._currentWidget = null
    this._nodes.clear()
    this._numbers.clear()
    this._widgets.length = 0
  }
  get currentChanged(): ISignal<this, FocusTracker.IChangedArgs<T>> {
    return this._currentChanged
  }
  get activeChanged(): ISignal<this, FocusTracker.IChangedArgs<T>> {
    return this._activeChanged
  }
  get isDisposed(): boolean {
    return this._counter < 0
  }
  get currentWidget(): T | null {
    return this._currentWidget
  }
  get activeWidget(): T | null {
    return this._activeWidget
  }
  get widgets(): ReadonlyArray<T> {
    return this._widgets
  }
  focusNumber(widget: T): number {
    const n = this._numbers.get(widget)
    return n === undefined ? -1 : n
  }
  has(widget: T): boolean {
    return this._numbers.has(widget)
  }
  add(widget: T): void {
    if (this._numbers.has(widget)) {
      return
    }
    const focused = widget.node.contains(document.activeElement)
    const n = focused ? this._counter++ : -1
    this._widgets.push(widget)
    this._numbers.set(widget, n)
    this._nodes.set(widget.node, widget)
    widget.node.addEventListener("focus", this, true)
    widget.node.addEventListener("blur", this, true)
    widget.disposed.connect(this._onWidgetDisposed, this)
    if (focused) {
      this._setWidgets(widget, widget)
    }
  }
  remove(widget: T): void {
    if (!this._numbers.has(widget)) {
      return
    }
    widget.disposed.disconnect(this._onWidgetDisposed, this)
    widget.node.removeEventListener("focus", this, true)
    widget.node.removeEventListener("blur", this, true)
    ArrayExt.removeFirstOf(this._widgets, widget)
    this._nodes.delete(widget.node)
    this._numbers.delete(widget)
    if (this._currentWidget !== widget) {
      return
    }
    const valid = this._widgets.filter(w => this._numbers.get(w) !== -1)
    const previous =
      max(valid, (first, second) => {
        let a = this._numbers.get(first)!
        let b = this._numbers.get(second)!
        return a - b
      }) || null
    this._setWidgets(previous, null)
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "focus":
        this._evtFocus(event as FocusEvent)
        break
      case "blur":
        this._evtBlur(event as FocusEvent)
        break
    }
  }
  private _setWidgets(current: T | null, active: T | null): void {
    const oldCurrent = this._currentWidget
    this._currentWidget = current
    const oldActive = this._activeWidget
    this._activeWidget = active
    if (oldCurrent !== current) {
      this._currentChanged.emit({ oldValue: oldCurrent, newValue: current })
    }
    if (oldActive !== active) {
      this._activeChanged.emit({ oldValue: oldActive, newValue: active })
    }
  }
  private _evtFocus(event: FocusEvent): void {
    const widget = this._nodes.get(event.currentTarget as HTMLElement)!
    if (widget !== this._currentWidget) {
      this._numbers.set(widget, this._counter++)
    }
    this._setWidgets(widget, widget)
  }
  private _evtBlur(event: FocusEvent): void {
    const widget = this._nodes.get(event.currentTarget as HTMLElement)!
    const focusTarget = event.relatedTarget as HTMLElement
    if (!focusTarget) {
      this._setWidgets(this._currentWidget, null)
      return
    }
    if (widget.node.contains(focusTarget)) {
      return
    }
    if (!find(this._widgets, w => w.node.contains(focusTarget))) {
      this._setWidgets(this._currentWidget, null)
      return
    }
  }
  private _onWidgetDisposed(sender: T): void {
    this.remove(sender)
  }
  private _counter = 0
  private _widgets: T[] = []
  private _activeWidget: T | null = null
  private _currentWidget: T | null = null
  private _numbers = new Map<T, number>()
  private _nodes = new Map<HTMLElement, T>()
  private _activeChanged = new Signal<this, FocusTracker.IChangedArgs<T>>(this)
  private _currentChanged = new Signal<this, FocusTracker.IChangedArgs<T>>(this)
}
export namespace FocusTracker {
  export interface IChangedArgs<T extends Widget> {
    oldValue: T | null
    newValue: T | null
  }
}
export class GridLayout extends Layout {
  constructor(options: GridLayout.IOptions = {}) {
    super(options)
    if (options.rowCount !== undefined) {
      Private.reallocSizers(this._rowSizers, options.rowCount)
    }
    if (options.columnCount !== undefined) {
      Private.reallocSizers(this._columnSizers, options.columnCount)
    }
    if (options.rowSpacing !== undefined) {
      this._rowSpacing = Private.clampValue(options.rowSpacing)
    }
    if (options.columnSpacing !== undefined) {
      this._columnSpacing = Private.clampValue(options.columnSpacing)
    }
  }
  dispose(): void {
    for (const item of this._items) {
      const widget = item.widget
      item.dispose()
      widget.dispose()
    }
    this._box = null
    this._items.length = 0
    this._rowStarts.length = 0
    this._rowSizers.length = 0
    this._columnStarts.length = 0
    this._columnSizers.length = 0
    super.dispose()
  }
  get rowCount(): number {
    return this._rowSizers.length
  }
  set rowCount(value: number) {
    if (value === this.rowCount) {
      return
    }
    Private.reallocSizers(this._rowSizers, value)
    if (this.parent) {
      this.parent.fit()
    }
  }
  get columnCount(): number {
    return this._columnSizers.length
  }
  set columnCount(value: number) {
    if (value === this.columnCount) {
      return
    }
    Private.reallocSizers(this._columnSizers, value)
    if (this.parent) {
      this.parent.fit()
    }
  }
  get rowSpacing(): number {
    return this._rowSpacing
  }
  set rowSpacing(value: number) {
    value = Private.clampValue(value)
    if (this._rowSpacing === value) {
      return
    }
    this._rowSpacing = value
    if (this.parent) {
      this.parent.fit()
    }
  }
  get columnSpacing(): number {
    return this._columnSpacing
  }
  set columnSpacing(value: number) {
    value = Private.clampValue(value)
    if (this._columnSpacing === value) {
      return
    }
    this._columnSpacing = value
    if (this.parent) {
      this.parent.fit()
    }
  }
  rowStretch(index: number): number {
    const sizer = this._rowSizers[index]
    return sizer ? sizer.stretch : -1
  }
  setRowStretch(index: number, value: number): void {
    const sizer = this._rowSizers[index]
    if (!sizer) {
      return
    }
    value = Private.clampValue(value)
    if (sizer.stretch === value) {
      return
    }
    sizer.stretch = value
    if (this.parent) {
      this.parent.update()
    }
  }
  columnStretch(index: number): number {
    const sizer = this._columnSizers[index]
    return sizer ? sizer.stretch : -1
  }
  setColumnStretch(index: number, value: number): void {
    const sizer = this._columnSizers[index]
    if (!sizer) {
      return
    }
    value = Private.clampValue(value)
    if (sizer.stretch === value) {
      return
    }
    sizer.stretch = value
    if (this.parent) {
      this.parent.update()
    }
  }
  *[Symbol.iterator](): IterableIterator<Widget> {
    for (const item of this._items) {
      yield item.widget
    }
  }
  addWidget(widget: Widget): void {
    const i = ArrayExt.findFirstIndex(this._items, it => it.widget === widget)
    if (i !== -1) {
      return
    }
    this._items.push(new LayoutItem(widget))
    if (this.parent) {
      this.attachWidget(widget)
    }
  }
  removeWidget(widget: Widget): void {
    const i = ArrayExt.findFirstIndex(this._items, it => it.widget === widget)
    if (i === -1) {
      return
    }
    const item = ArrayExt.removeAt(this._items, i)!
    if (this.parent) {
      this.detachWidget(widget)
    }
    item.dispose()
  }
  protected init(): void {
    super.init()
    for (const widget of this) {
      this.attachWidget(widget)
    }
  }
  protected attachWidget(widget: Widget): void {
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach)
    }
    this.parent!.node.appendChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach)
    }
    this.parent!.fit()
  }
  protected detachWidget(widget: Widget): void {
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach)
    }
    this.parent!.node.removeChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach)
    }
    this.parent!.fit()
  }
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg)
    this.parent!.update()
  }
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg)
    this.parent!.fit()
  }
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height)
    }
  }
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1)
    }
  }
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit()
    }
  }
  private _fit(): void {
    for (let i = 0, n = this.rowCount; i < n; ++i) {
      this._rowSizers[i].minSize = 0
    }
    for (let i = 0, n = this.columnCount; i < n; ++i) {
      this._columnSizers[i].minSize = 0
    }
    const items = this._items.filter(it => !it.isHidden)
    for (let i = 0, n = items.length; i < n; ++i) {
      items[i].fit()
    }
    const maxRow = this.rowCount - 1
    const maxCol = this.columnCount - 1
    items.sort(Private.rowSpanCmp)
    for (let i = 0, n = items.length; i < n; ++i) {
      const item = items[i]
      const config = GridLayout.getCellConfig(item.widget)
      const r1 = Math.min(config.row, maxRow)
      const r2 = Math.min(config.row + config.rowSpan - 1, maxRow)
      Private.distributeMin(this._rowSizers, r1, r2, item.minHeight)
    }
    items.sort(Private.columnSpanCmp)
    for (let i = 0, n = items.length; i < n; ++i) {
      const item = items[i]
      const config = GridLayout.getCellConfig(item.widget)
      const c1 = Math.min(config.column, maxCol)
      const c2 = Math.min(config.column + config.columnSpan - 1, maxCol)
      Private.distributeMin(this._columnSizers, c1, c2, item.minWidth)
    }
    if (this.fitPolicy === "set-no-constraint") {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest)
      return
    }
    let minH = maxRow * this._rowSpacing
    let minW = maxCol * this._columnSpacing
    for (let i = 0, n = this.rowCount; i < n; ++i) {
      minH += this._rowSizers[i].minSize
    }
    for (let i = 0, n = this.columnCount; i < n; ++i) {
      minW += this._columnSizers[i].minSize
    }
    const box = (this._box = ElementExt.boxSizing(this.parent!.node))
    minW += box.horizontalSum
    minH += box.verticalSum
    const style = this.parent!.node.style
    style.minWidth = `${minW}px`
    style.minHeight = `${minH}px`
    this._dirty = true
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest)
    }
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest)
    }
  }
  private _update(offsetWidth: number, offsetHeight: number): void {
    this._dirty = false
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight
    }
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node)
    }
    const top = this._box.paddingTop
    const left = this._box.paddingLeft
    const width = offsetWidth - this._box.horizontalSum
    const height = offsetHeight - this._box.verticalSum
    const maxRow = this.rowCount - 1
    const maxCol = this.columnCount - 1
    const fixedRowSpace = maxRow * this._rowSpacing
    const fixedColSpace = maxCol * this._columnSpacing
    BoxEngine.calc(this._rowSizers, Math.max(0, height - fixedRowSpace))
    BoxEngine.calc(this._columnSizers, Math.max(0, width - fixedColSpace))
    for (let i = 0, pos = top, n = this.rowCount; i < n; ++i) {
      this._rowStarts[i] = pos
      pos += this._rowSizers[i].size + this._rowSpacing
    }
    for (let i = 0, pos = left, n = this.columnCount; i < n; ++i) {
      this._columnStarts[i] = pos
      pos += this._columnSizers[i].size + this._columnSpacing
    }
    for (let i = 0, n = this._items.length; i < n; ++i) {
      const item = this._items[i]
      if (item.isHidden) {
        continue
      }
      const config = GridLayout.getCellConfig(item.widget)
      const r1 = Math.min(config.row, maxRow)
      const c1 = Math.min(config.column, maxCol)
      const r2 = Math.min(config.row + config.rowSpan - 1, maxRow)
      const c2 = Math.min(config.column + config.columnSpan - 1, maxCol)
      const x = this._columnStarts[c1]
      const y = this._rowStarts[r1]
      const w = this._columnStarts[c2] + this._columnSizers[c2].size - x
      const h = this._rowStarts[r2] + this._rowSizers[r2].size - y
      item.update(x, y, w, h)
    }
  }
  private _dirty = false
  private _rowSpacing = 4
  private _columnSpacing = 4
  private _items: LayoutItem[] = []
  private _rowStarts: number[] = []
  private _columnStarts: number[] = []
  private _rowSizers: BoxSizer[] = [new BoxSizer()]
  private _columnSizers: BoxSizer[] = [new BoxSizer()]
  private _box: ElementExt.IBoxSizing | null = null
}
export namespace GridLayout {
  export interface IOptions extends Layout.IOptions {
    rowCount?: number
    columnCount?: number
    rowSpacing?: number
    columnSpacing?: number
  }
  export interface ICellConfig {
    readonly row: number
    readonly column: number
    readonly rowSpan: number
    readonly columnSpan: number
  }
  export function getCellConfig(widget: Widget): ICellConfig {
    return Private.cellConfigProperty.get(widget)
  }
  export function setCellConfig(
    widget: Widget,
    value: Partial<ICellConfig>
  ): void {
    Private.cellConfigProperty.set(widget, Private.normalizeConfig(value))
  }
}
namespace Private {
  export const cellConfigProperty = new AttachedProperty<
    Widget,
    GridLayout.ICellConfig
  >({
    name: "cellConfig",
    create: () => ({ row: 0, column: 0, rowSpan: 1, columnSpan: 1 }),
    changed: onChildCellConfigChanged,
  })
  export function normalizeConfig(
    config: Partial<GridLayout.ICellConfig>
  ): GridLayout.ICellConfig {
    const row = Math.max(0, Math.floor(config.row || 0))
    const column = Math.max(0, Math.floor(config.column || 0))
    const rowSpan = Math.max(1, Math.floor(config.rowSpan || 0))
    const columnSpan = Math.max(1, Math.floor(config.columnSpan || 0))
    return { row, column, rowSpan, columnSpan }
  }
  export function clampValue(value: number): number {
    return Math.max(0, Math.floor(value))
  }
  export function rowSpanCmp(a: LayoutItem, b: LayoutItem): number {
    const c1 = cellConfigProperty.get(a.widget)
    const c2 = cellConfigProperty.get(b.widget)
    return c1.rowSpan - c2.rowSpan
  }
  export function columnSpanCmp(a: LayoutItem, b: LayoutItem): number {
    const c1 = cellConfigProperty.get(a.widget)
    const c2 = cellConfigProperty.get(b.widget)
    return c1.columnSpan - c2.columnSpan
  }
  export function reallocSizers(sizers: BoxSizer[], count: number): void {
    count = Math.max(1, Math.floor(count))
    while (sizers.length < count) {
      sizers.push(new BoxSizer())
    }
    if (sizers.length > count) {
      sizers.length = count
    }
  }
  export function distributeMin(
    sizers: BoxSizer[],
    i1: number,
    i2: number,
    minSize: number
  ): void {
    if (i2 < i1) {
      return
    }
    if (i1 === i2) {
      const sizer = sizers[i1]
      sizer.minSize = Math.max(sizer.minSize, minSize)
      return
    }
    let totalMin = 0
    for (let i = i1; i <= i2; ++i) {
      totalMin += sizers[i].minSize
    }
    if (totalMin >= minSize) {
      return
    }
    const portion = (minSize - totalMin) / (i2 - i1 + 1)
    for (let i = i1; i <= i2; ++i) {
      sizers[i].minSize += portion
    }
  }
  function onChildCellConfigChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof GridLayout) {
      child.parent.fit()
    }
  }
}
export abstract class Layout implements Iterable<Widget>, IDisposable {
  constructor(options: Layout.IOptions = {}) {
    this._fitPolicy = options.fitPolicy || "set-min-size"
  }
  dispose(): void {
    this._parent = null
    this._disposed = true
    Signal.clearData(this)
    AttachedProperty.clearData(this)
  }
  get isDisposed(): boolean {
    return this._disposed
  }
  get parent(): Widget | null {
    return this._parent
  }
  set parent(value: Widget | null) {
    if (this._parent === value) {
      return
    }
    if (this._parent) {
      throw new Error("Cannot change parent widget.")
    }
    if (value!.layout !== this) {
      throw new Error("Invalid parent widget.")
    }
    this._parent = value
    this.init()
  }
  get fitPolicy(): Layout.FitPolicy {
    return this._fitPolicy
  }
  set fitPolicy(value: Layout.FitPolicy) {
    if (this._fitPolicy === value) {
      return
    }
    this._fitPolicy = value
    if (this._parent) {
      const style = this._parent.node.style
      style.minWidth = ""
      style.minHeight = ""
      style.maxWidth = ""
      style.maxHeight = ""
      this._parent.fit()
    }
  }
  abstract [Symbol.iterator](): IterableIterator<Widget>
  abstract removeWidget(widget: Widget): void
  processParentMessage(msg: Message): void {
    switch (msg.type) {
      case "resize":
        this.onResize(msg as Widget.ResizeMessage)
        break
      case "update-request":
        this.onUpdateRequest(msg)
        break
      case "fit-request":
        this.onFitRequest(msg)
        break
      case "before-show":
        this.onBeforeShow(msg)
        break
      case "after-show":
        this.onAfterShow(msg)
        break
      case "before-hide":
        this.onBeforeHide(msg)
        break
      case "after-hide":
        this.onAfterHide(msg)
        break
      case "before-attach":
        this.onBeforeAttach(msg)
        break
      case "after-attach":
        this.onAfterAttach(msg)
        break
      case "before-detach":
        this.onBeforeDetach(msg)
        break
      case "after-detach":
        this.onAfterDetach(msg)
        break
      case "child-removed":
        this.onChildRemoved(msg as Widget.ChildMessage)
        break
      case "child-shown":
        this.onChildShown(msg as Widget.ChildMessage)
        break
      case "child-hidden":
        this.onChildHidden(msg as Widget.ChildMessage)
        break
    }
  }
  protected init(): void {
    for (const widget of this) {
      widget.parent = this.parent
    }
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize)
    }
  }
  protected onUpdateRequest(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize)
    }
  }
  protected onBeforeAttach(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, msg)
    }
  }
  protected onAfterAttach(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, msg)
    }
  }
  protected onBeforeDetach(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, msg)
    }
  }
  protected onAfterDetach(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, msg)
    }
  }
  protected onBeforeShow(msg: Message): void {
    for (const widget of this) {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg)
      }
    }
  }
  protected onAfterShow(msg: Message): void {
    for (const widget of this) {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg)
      }
    }
  }
  protected onBeforeHide(msg: Message): void {
    for (const widget of this) {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg)
      }
    }
  }
  protected onAfterHide(msg: Message): void {
    for (const widget of this) {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg)
      }
    }
  }
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    this.removeWidget(msg.child)
  }
  protected onFitRequest(msg: Message): void {}
  protected onChildShown(msg: Widget.ChildMessage): void {}
  protected onChildHidden(msg: Widget.ChildMessage): void {}
  private _disposed = false
  private _fitPolicy: Layout.FitPolicy
  private _parent: Widget | null = null
}
export namespace Layout {
  export type FitPolicy = "set-no-constraint" | "set-min-size"
  export interface IOptions {
    fitPolicy?: FitPolicy
  }
  export type HorizontalAlignment = "left" | "center" | "right"
  export type VerticalAlignment = "top" | "center" | "bottom"
  export function getHorizontalAlignment(widget: Widget): HorizontalAlignment {
    return Private.horizontalAlignmentProperty.get(widget)
  }
  export function setHorizontalAlignment(
    widget: Widget,
    value: HorizontalAlignment
  ): void {
    Private.horizontalAlignmentProperty.set(widget, value)
  }
  export function getVerticalAlignment(widget: Widget): VerticalAlignment {
    return Private.verticalAlignmentProperty.get(widget)
  }
  export function setVerticalAlignment(
    widget: Widget,
    value: VerticalAlignment
  ): void {
    Private.verticalAlignmentProperty.set(widget, value)
  }
}
export class LayoutItem implements IDisposable {
  constructor(widget: Widget) {
    this.widget = widget
    this.widget.node.style.position = "absolute"
  }
  dispose(): void {
    if (this._disposed) {
      return
    }
    this._disposed = true
    const style = this.widget.node.style
    style.position = ""
    style.top = ""
    style.left = ""
    style.width = ""
    style.height = ""
  }
  readonly widget: Widget
  get minWidth(): number {
    return this._minWidth
  }
  get minHeight(): number {
    return this._minHeight
  }
  get maxWidth(): number {
    return this._maxWidth
  }
  get maxHeight(): number {
    return this._maxHeight
  }
  get isDisposed(): boolean {
    return this._disposed
  }
  get isHidden(): boolean {
    return this.widget.isHidden
  }
  get isVisible(): boolean {
    return this.widget.isVisible
  }
  get isAttached(): boolean {
    return this.widget.isAttached
  }
  fit(): void {
    const limits = ElementExt.sizeLimits(this.widget.node)
    this._minWidth = limits.minWidth
    this._minHeight = limits.minHeight
    this._maxWidth = limits.maxWidth
    this._maxHeight = limits.maxHeight
  }
  update(left: number, top: number, width: number, height: number): void {
    const clampW = Math.max(this._minWidth, Math.min(width, this._maxWidth))
    const clampH = Math.max(this._minHeight, Math.min(height, this._maxHeight))
    if (clampW < width) {
      switch (Layout.getHorizontalAlignment(this.widget)) {
        case "left":
          break
        case "center":
          left += (width - clampW) / 2
          break
        case "right":
          left += width - clampW
          break
        default:
          throw "unreachable"
      }
    }
    if (clampH < height) {
      switch (Layout.getVerticalAlignment(this.widget)) {
        case "top":
          break
        case "center":
          top += (height - clampH) / 2
          break
        case "bottom":
          top += height - clampH
          break
        default:
          throw "unreachable"
      }
    }
    let resized = false
    const style = this.widget.node.style
    if (this._top !== top) {
      this._top = top
      style.top = `${top}px`
    }
    if (this._left !== left) {
      this._left = left
      style.left = `${left}px`
    }
    if (this._width !== clampW) {
      resized = true
      this._width = clampW
      style.width = `${clampW}px`
    }
    if (this._height !== clampH) {
      resized = true
      this._height = clampH
      style.height = `${clampH}px`
    }
    if (resized) {
      const msg = new Widget.ResizeMessage(clampW, clampH)
      MessageLoop.sendMessage(this.widget, msg)
    }
  }
  private _top = NaN
  private _left = NaN
  private _width = NaN
  private _height = NaN
  private _minWidth = 0
  private _minHeight = 0
  private _maxWidth = Infinity
  private _maxHeight = Infinity
  private _disposed = false
}
namespace Private {
  export const horizontalAlignmentProperty = new AttachedProperty<
    Widget,
    Layout.HorizontalAlignment
  >({
    name: "horizontalAlignment",
    create: () => "center",
    changed: onAlignmentChanged,
  })
  export const verticalAlignmentProperty = new AttachedProperty<
    Widget,
    Layout.VerticalAlignment
  >({
    name: "verticalAlignment",
    create: () => "top",
    changed: onAlignmentChanged,
  })
  function onAlignmentChanged(child: Widget): void {
    if (child.parent && child.parent.layout) {
      child.parent.update()
    }
  }
}
export class Menu extends Widget {
  constructor(options: Menu.IOptions) {
    super({ node: Private.createNode() })
    this.addClass("lm-Menu")
    this.setFlag(Widget.Flag.DisallowLayout)
    this.commands = options.commands
    this.renderer = options.renderer || Menu.defaultRenderer
  }
  dispose(): void {
    this.close()
    this._items.length = 0
    super.dispose()
  }
  get aboutToClose(): ISignal<this, void> {
    return this._aboutToClose
  }
  get menuRequested(): ISignal<this, "next" | "previous"> {
    return this._menuRequested
  }
  readonly commands: CommandRegistry
  readonly renderer: Menu.IRenderer
  get parentMenu(): Menu | null {
    return this._parentMenu
  }
  get childMenu(): Menu | null {
    return this._childMenu
  }
  get rootMenu(): Menu {
    let menu: Menu = this
    while (menu._parentMenu) {
      menu = menu._parentMenu
    }
    return menu
  }
  get leafMenu(): Menu {
    let menu: Menu = this
    while (menu._childMenu) {
      menu = menu._childMenu
    }
    return menu
  }
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(
      "lm-Menu-content"
    )[0] as HTMLUListElement
  }
  get activeItem(): Menu.IItem | null {
    return this._items[this._activeIndex] || null
  }
  set activeItem(value: Menu.IItem | null) {
    this.activeIndex = value ? this._items.indexOf(value) : -1
  }
  get activeIndex(): number {
    return this._activeIndex
  }
  set activeIndex(value: number) {
    if (value < 0 || value >= this._items.length) {
      value = -1
    }
    if (value !== -1 && !Private.canActivate(this._items[value])) {
      value = -1
    }
    if (this._activeIndex === value) {
      return
    }
    this._activeIndex = value
    if (
      this._activeIndex >= 0 &&
      this.contentNode.childNodes[this._activeIndex]
    ) {
      ;(this.contentNode.childNodes[this._activeIndex] as HTMLElement).focus()
    }
    this.update()
  }
  get items(): ReadonlyArray<Menu.IItem> {
    return this._items
  }
  activateNextItem(): void {
    const n = this._items.length
    const ai = this._activeIndex
    const start = ai < n - 1 ? ai + 1 : 0
    const stop = start === 0 ? n - 1 : start - 1
    this.activeIndex = ArrayExt.findFirstIndex(
      this._items,
      Private.canActivate,
      start,
      stop
    )
  }
  activatePreviousItem(): void {
    const n = this._items.length
    const ai = this._activeIndex
    const start = ai <= 0 ? n - 1 : ai - 1
    const stop = start === n - 1 ? 0 : start + 1
    this.activeIndex = ArrayExt.findLastIndex(
      this._items,
      Private.canActivate,
      start,
      stop
    )
  }
  triggerActiveItem(): void {
    if (!this.isAttached) {
      return
    }
    const item = this.activeItem
    if (!item) {
      return
    }
    this._cancelOpenTimer()
    this._cancelCloseTimer()
    if (item.type === "submenu") {
      this._openChildMenu(true)
      return
    }
    this.rootMenu.close()
    const { command, args } = item
    if (this.commands.isEnabled(command, args)) {
      this.commands.execute(command, args)
    } else {
      console.log(`Command '${command}' is disabled.`)
    }
  }
  addItem(options: Menu.IItemOptions): Menu.IItem {
    return this.insertItem(this._items.length, options)
  }
  insertItem(index: number, options: Menu.IItemOptions): Menu.IItem {
    if (this.isAttached) {
      this.close()
    }
    this.activeIndex = -1
    const i = Math.max(0, Math.min(index, this._items.length))
    const item = Private.createItem(this, options)
    ArrayExt.insert(this._items, i, item)
    this.update()
    return item
  }
  removeItem(item: Menu.IItem): void {
    this.removeItemAt(this._items.indexOf(item))
  }
  removeItemAt(index: number): void {
    if (this.isAttached) {
      this.close()
    }
    this.activeIndex = -1
    const item = ArrayExt.removeAt(this._items, index)
    if (!item) {
      return
    }
    this.update()
  }
  clearItems(): void {
    if (this.isAttached) {
      this.close()
    }
    this.activeIndex = -1
    if (this._items.length === 0) {
      return
    }
    this._items.length = 0
    this.update()
  }
  open(x: number, y: number, options: Menu.IOpenOptions = {}): void {
    if (this.isAttached) {
      return
    }
    const forceX = options.forceX || false
    const forceY = options.forceY || false
    Private.openRootMenu(this, x, y, forceX, forceY)
    this.activate()
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "keydown":
        this._evtKeyDown(event as KeyboardEvent)
        break
      case "mouseup":
        this._evtMouseUp(event as MouseEvent)
        break
      case "mousemove":
        this._evtMouseMove(event as MouseEvent)
        break
      case "mouseenter":
        this._evtMouseEnter(event as MouseEvent)
        break
      case "mouseleave":
        this._evtMouseLeave(event as MouseEvent)
        break
      case "mousedown":
        this._evtMouseDown(event as MouseEvent)
        break
      case "contextmenu":
        event.preventDefault()
        event.stopPropagation()
        break
    }
  }
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener("keydown", this)
    this.node.addEventListener("mouseup", this)
    this.node.addEventListener("mousemove", this)
    this.node.addEventListener("mouseenter", this)
    this.node.addEventListener("mouseleave", this)
    this.node.addEventListener("contextmenu", this)
    document.addEventListener("mousedown", this, true)
  }
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener("keydown", this)
    this.node.removeEventListener("mouseup", this)
    this.node.removeEventListener("mousemove", this)
    this.node.removeEventListener("mouseenter", this)
    this.node.removeEventListener("mouseleave", this)
    this.node.removeEventListener("contextmenu", this)
    document.removeEventListener("mousedown", this, true)
  }
  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      this.node.focus()
    }
  }
  protected onUpdateRequest(msg: Message): void {
    const items = this._items
    const renderer = this.renderer
    const activeIndex = this._activeIndex
    const collapsedFlags = Private.computeCollapsed(items)
    const content = new Array<VirtualElement>(items.length)
    for (let i = 0, n = items.length; i < n; ++i) {
      const item = items[i]
      const active = i === activeIndex
      const collapsed = collapsedFlags[i]
      content[i] = renderer.renderItem({
        item,
        active,
        collapsed,
        onfocus: () => {
          this.activeIndex = i
        },
      })
    }
    VirtualDOM.render(content, this.contentNode)
  }
  protected onCloseRequest(msg: Message): void {
    this._cancelOpenTimer()
    this._cancelCloseTimer()
    this.activeIndex = -1
    const childMenu = this._childMenu
    if (childMenu) {
      this._childIndex = -1
      this._childMenu = null
      childMenu._parentMenu = null
      childMenu.close()
    }
    const parentMenu = this._parentMenu
    if (parentMenu) {
      this._parentMenu = null
      parentMenu._childIndex = -1
      parentMenu._childMenu = null
      parentMenu.activate()
    }
    if (this.isAttached) {
      this._aboutToClose.emit(undefined)
    }
    super.onCloseRequest(msg)
  }
  private _evtKeyDown(event: KeyboardEvent): void {
    event.preventDefault()
    event.stopPropagation()
    const kc = event.keyCode
    if (kc === 13) {
      this.triggerActiveItem()
      return
    }
    if (kc === 27) {
      this.close()
      return
    }
    if (kc === 37) {
      if (this._parentMenu) {
        this.close()
      } else {
        this._menuRequested.emit("previous")
      }
      return
    }
    if (kc === 38) {
      this.activatePreviousItem()
      return
    }
    if (kc === 39) {
      const item = this.activeItem
      if (item && item.type === "submenu") {
        this.triggerActiveItem()
      } else {
        this.rootMenu._menuRequested.emit("next")
      }
      return
    }
    if (kc === 40) {
      this.activateNextItem()
      return
    }
    const key = getKeyboardLayout().keyForKeydownEvent(event)
    if (!key) {
      return
    }
    const start = this._activeIndex + 1
    const result = Private.findMnemonic(this._items, key, start)
    if (result.index !== -1 && !result.multiple) {
      this.activeIndex = result.index
      this.triggerActiveItem()
    } else if (result.index !== -1) {
      this.activeIndex = result.index
    } else if (result.auto !== -1) {
      this.activeIndex = result.auto
    }
  }
  private _evtMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this.triggerActiveItem()
  }
  private _evtMouseMove(event: MouseEvent): void {
    let index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return ElementExt.hitTest(node, event.clientX, event.clientY)
    })
    if (index === this._activeIndex) {
      return
    }
    this.activeIndex = index
    index = this.activeIndex
    if (index === this._childIndex) {
      this._cancelOpenTimer()
      this._cancelCloseTimer()
      return
    }
    if (this._childIndex !== -1) {
      this._startCloseTimer()
    }
    this._cancelOpenTimer()
    const item = this.activeItem
    if (!item || item.type !== "submenu" || !item.submenu) {
      return
    }
    this._startOpenTimer()
  }
  private _evtMouseEnter(event: MouseEvent): void {
    for (let menu = this._parentMenu; menu; menu = menu._parentMenu) {
      menu._cancelOpenTimer()
      menu._cancelCloseTimer()
      menu.activeIndex = menu._childIndex
    }
  }
  private _evtMouseLeave(event: MouseEvent): void {
    this._cancelOpenTimer()
    if (!this._childMenu) {
      this.activeIndex = -1
      return
    }
    const { clientX, clientY } = event
    if (ElementExt.hitTest(this._childMenu.node, clientX, clientY)) {
      this._cancelCloseTimer()
      return
    }
    this.activeIndex = -1
    this._startCloseTimer()
  }
  private _evtMouseDown(event: MouseEvent): void {
    if (this._parentMenu) {
      return
    }
    if (Private.hitTestMenus(this, event.clientX, event.clientY)) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      this.close()
    }
  }
  private _openChildMenu(activateFirst = false): void {
    const item = this.activeItem
    if (!item || item.type !== "submenu" || !item.submenu) {
      this._closeChildMenu()
      return
    }
    const submenu = item.submenu
    if (submenu === this._childMenu) {
      return
    }
    this._closeChildMenu()
    this._childMenu = submenu
    this._childIndex = this._activeIndex
    submenu._parentMenu = this
    MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest)
    const itemNode = this.contentNode.children[this._activeIndex]
    Private.openSubmenu(submenu, itemNode as HTMLElement)
    if (activateFirst) {
      submenu.activeIndex = -1
      submenu.activateNextItem()
    }
    submenu.activate()
  }
  private _closeChildMenu(): void {
    if (this._childMenu) {
      this._childMenu.close()
    }
  }
  private _startOpenTimer(): void {
    if (this._openTimerID === 0) {
      this._openTimerID = window.setTimeout(() => {
        this._openTimerID = 0
        this._openChildMenu()
      }, Private.TIMER_DELAY)
    }
  }
  private _startCloseTimer(): void {
    if (this._closeTimerID === 0) {
      this._closeTimerID = window.setTimeout(() => {
        this._closeTimerID = 0
        this._closeChildMenu()
      }, Private.TIMER_DELAY)
    }
  }
  private _cancelOpenTimer(): void {
    if (this._openTimerID !== 0) {
      clearTimeout(this._openTimerID)
      this._openTimerID = 0
    }
  }
  private _cancelCloseTimer(): void {
    if (this._closeTimerID !== 0) {
      clearTimeout(this._closeTimerID)
      this._closeTimerID = 0
    }
  }
  private _childIndex = -1
  private _activeIndex = -1
  private _openTimerID = 0
  private _closeTimerID = 0
  private _items: Menu.IItem[] = []
  private _childMenu: Menu | null = null
  private _parentMenu: Menu | null = null
  private _aboutToClose = new Signal<this, void>(this)
  private _menuRequested = new Signal<this, "next" | "previous">(this)
}
export namespace Menu {
  export interface IOptions {
    commands: CommandRegistry
    renderer?: IRenderer
  }
  export interface IOpenOptions {
    forceX?: boolean
    forceY?: boolean
  }
  export type ItemType = "command" | "submenu" | "separator"
  export interface IItemOptions {
    type?: ItemType
    command?: string
    args?: ReadonlyJSONObject
    submenu?: Menu | null
  }
  export interface IItem {
    readonly type: ItemType
    readonly command: string
    readonly args: ReadonlyJSONObject
    readonly submenu: Menu | null
    readonly label: string
    readonly mnemonic: number
    readonly icon: VirtualElement.IRenderer | undefined
    readonly iconClass: string
    readonly iconLabel: string
    readonly caption: string
    readonly className: string
    readonly dataset: CommandRegistry.Dataset
    readonly isEnabled: boolean
    readonly isToggled: boolean
    readonly isVisible: boolean
    readonly keyBinding: CommandRegistry.IKeyBinding | null
  }
  export interface IRenderData {
    readonly item: IItem
    readonly active: boolean
    readonly collapsed: boolean
    readonly onfocus?: () => void
  }
  export interface IRenderer {
    renderItem(data: IRenderData): VirtualElement
  }
  export class Renderer implements IRenderer {
    renderItem(data: IRenderData): VirtualElement {
      const className = this.createItemClass(data)
      const dataset = this.createItemDataset(data)
      const aria = this.createItemARIA(data)
      return h.li(
        {
          className,
          dataset,
          tabindex: "0",
          onfocus: data.onfocus,
          ...aria,
        },
        this.renderIcon(data),
        this.renderLabel(data),
        this.renderShortcut(data),
        this.renderSubmenu(data)
      )
    }
    renderIcon(data: IRenderData): VirtualElement {
      const className = this.createIconClass(data)
      return h.div({ className }, data.item.icon!, data.item.iconLabel)
    }
    renderLabel(data: IRenderData): VirtualElement {
      const content = this.formatLabel(data)
      return h.div({ className: "lm-Menu-itemLabel" }, content)
    }
    renderShortcut(data: IRenderData): VirtualElement {
      const content = this.formatShortcut(data)
      return h.div({ className: "lm-Menu-itemShortcut" }, content)
    }
    renderSubmenu(data: IRenderData): VirtualElement {
      return h.div({ className: "lm-Menu-itemSubmenuIcon" })
    }
    createItemClass(data: IRenderData): string {
      let name = "lm-Menu-item"
      if (!data.item.isEnabled) {
        name += " lm-mod-disabled"
      }
      if (data.item.isToggled) {
        name += " lm-mod-toggled"
      }
      if (!data.item.isVisible) {
        name += " lm-mod-hidden"
      }
      if (data.active) {
        name += " lm-mod-active"
      }
      if (data.collapsed) {
        name += " lm-mod-collapsed"
      }
      const extra = data.item.className
      if (extra) {
        name += ` ${extra}`
      }
      return name
    }
    createItemDataset(data: IRenderData): ElementDataset {
      let result: ElementDataset
      const { type, command, dataset } = data.item
      if (type === "command") {
        result = { ...dataset, type, command }
      } else {
        result = { ...dataset, type }
      }
      return result
    }
    createIconClass(data: IRenderData): string {
      const name = "lm-Menu-itemIcon"
      const extra = data.item.iconClass
      return extra ? `${name} ${extra}` : name
    }
    createItemARIA(data: IRenderData): ElementARIAAttrs {
      const aria: { [T in ARIAAttrNames]?: string } = {}
      switch (data.item.type) {
        case "separator":
          aria.role = "presentation"
          break
        case "submenu":
          aria["aria-haspopup"] = "true"
          if (!data.item.isEnabled) {
            aria["aria-disabled"] = "true"
          }
          break
        default:
          if (!data.item.isEnabled) {
            aria["aria-disabled"] = "true"
          }
          aria.role = "menuitem"
      }
      return aria
    }
    formatLabel(data: IRenderData): h.Child {
      const { label, mnemonic } = data.item
      if (mnemonic < 0 || mnemonic >= label.length) {
        return label
      }
      const prefix = label.slice(0, mnemonic)
      const suffix = label.slice(mnemonic + 1)
      const char = label[mnemonic]
      const span = h.span({ className: "lm-Menu-itemMnemonic" }, char)
      return [prefix, span, suffix]
    }
    formatShortcut(data: IRenderData): h.Child {
      const kb = data.item.keyBinding
      return kb ? kb.keys.map(CommandRegistry.formatKeystroke).join(", ") : null
    }
  }
  export const defaultRenderer = new Renderer()
}
namespace Private {
  export const TIMER_DELAY = 300
  export const SUBMENU_OVERLAP = 3
  export function createNode(): HTMLDivElement {
    const node = document.createElement("div")
    const content = document.createElement("ul")
    content.className = "lm-Menu-content"
    node.appendChild(content)
    content.setAttribute("role", "menu")
    node.tabIndex = 0
    return node
  }
  export function canActivate(item: Menu.IItem): boolean {
    return item.type !== "separator" && item.isEnabled && item.isVisible
  }
  export function createItem(
    owner: Menu,
    options: Menu.IItemOptions
  ): Menu.IItem {
    return new MenuItem(owner.commands, options)
  }
  export function hitTestMenus(menu: Menu, x: number, y: number): boolean {
    for (let temp: Menu | null = menu; temp; temp = temp.childMenu) {
      if (ElementExt.hitTest(temp.node, x, y)) {
        return true
      }
    }
    return false
  }
  export function computeCollapsed(
    items: ReadonlyArray<Menu.IItem>
  ): boolean[] {
    const result = new Array<boolean>(items.length)
    ArrayExt.fill(result, false)
    let k1 = 0
    const n = items.length
    for (; k1 < n; ++k1) {
      const item = items[k1]
      if (!item.isVisible) {
        continue
      }
      if (item.type !== "separator") {
        break
      }
      result[k1] = true
    }
    let k2 = n - 1
    for (; k2 >= 0; --k2) {
      const item = items[k2]
      if (!item.isVisible) {
        continue
      }
      if (item.type !== "separator") {
        break
      }
      result[k2] = true
    }
    let hide = false
    while (++k1 < k2) {
      const item = items[k1]
      if (!item.isVisible) {
        continue
      }
      if (item.type !== "separator") {
        hide = false
      } else if (hide) {
        result[k1] = true
      } else {
        hide = true
      }
    }
    return result
  }
  export function openRootMenu(
    menu: Menu,
    x: number,
    y: number,
    forceX: boolean,
    forceY: boolean
  ): void {
    MessageLoop.sendMessage(menu, Widget.Msg.UpdateRequest)
    const px = window.pageXOffset
    const py = window.pageYOffset
    const cw = document.documentElement.clientWidth
    const ch = document.documentElement.clientHeight
    const maxHeight = ch - (forceY ? y : 0)
    const node = menu.node
    const style = node.style
    style.top = ""
    style.left = ""
    style.width = ""
    style.height = ""
    style.visibility = "hidden"
    style.maxHeight = `${maxHeight}px`
    Widget.attach(menu, document.body)
    const { width, height } = node.getBoundingClientRect()
    if (!forceX && x + width > px + cw) {
      x = px + cw - width
    }
    if (!forceY && y + height > py + ch) {
      if (y > py + ch) {
        y = py + ch - height
      } else {
        y = y - height
      }
    }
    style.top = `${Math.max(0, y)}px`
    style.left = `${Math.max(0, x)}px`
    style.visibility = ""
  }
  export function openSubmenu(submenu: Menu, itemNode: HTMLElement): void {
    MessageLoop.sendMessage(submenu, Widget.Msg.UpdateRequest)
    const px = window.pageXOffset
    const py = window.pageYOffset
    const cw = document.documentElement.clientWidth
    const ch = document.documentElement.clientHeight
    const maxHeight = ch
    const node = submenu.node
    const style = node.style
    style.top = ""
    style.left = ""
    style.width = ""
    style.height = ""
    style.visibility = "hidden"
    style.maxHeight = `${maxHeight}px`
    Widget.attach(submenu, document.body)
    const { width, height } = node.getBoundingClientRect()
    const box = ElementExt.boxSizing(submenu.node)
    const itemRect = itemNode.getBoundingClientRect()
    let x = itemRect.right - SUBMENU_OVERLAP
    if (x + width > px + cw) {
      x = itemRect.left + SUBMENU_OVERLAP - width
    }
    let y = itemRect.top - box.borderTop - box.paddingTop
    if (y + height > py + ch) {
      y = itemRect.bottom + box.borderBottom + box.paddingBottom - height
    }
    style.top = `${Math.max(0, y)}px`
    style.left = `${Math.max(0, x)}px`
    style.visibility = ""
  }
  export interface IMnemonicResult {
    index: number
    multiple: boolean
    auto: number
  }
  export function findMnemonic(
    items: ReadonlyArray<Menu.IItem>,
    key: string,
    start: number
  ): IMnemonicResult {
    let index = -1
    let auto = -1
    let multiple = false
    const upperKey = key.toUpperCase()
    for (let i = 0, n = items.length; i < n; ++i) {
      const k = (i + start) % n
      const item = items[k]
      if (!canActivate(item)) {
        continue
      }
      const label = item.label
      if (label.length === 0) {
        continue
      }
      const mn = item.mnemonic
      if (mn >= 0 && mn < label.length) {
        if (label[mn].toUpperCase() === upperKey) {
          if (index === -1) {
            index = k
          } else {
            multiple = true
          }
        }
        continue
      }
      if (auto === -1 && label[0].toUpperCase() === upperKey) {
        auto = k
      }
    }
    return { index, multiple, auto }
  }
  class MenuItem implements Menu.IItem {
    constructor(commands: CommandRegistry, options: Menu.IItemOptions) {
      this._commands = commands
      this.type = options.type || "command"
      this.command = options.command || ""
      this.args = options.args || JSONExt.emptyObject
      this.submenu = options.submenu || null
    }
    readonly type: Menu.ItemType
    readonly command: string
    readonly args: ReadonlyJSONObject
    readonly submenu: Menu | null
    get label(): string {
      if (this.type === "command") {
        return this._commands.label(this.command, this.args)
      }
      if (this.type === "submenu" && this.submenu) {
        return this.submenu.title.label
      }
      return ""
    }
    get mnemonic(): number {
      if (this.type === "command") {
        return this._commands.mnemonic(this.command, this.args)
      }
      if (this.type === "submenu" && this.submenu) {
        return this.submenu.title.mnemonic
      }
      return -1
    }
    get icon(): VirtualElement.IRenderer | undefined {
      if (this.type === "command") {
        return this._commands.icon(this.command, this.args)
      }
      if (this.type === "submenu" && this.submenu) {
        return this.submenu.title.icon
      }
      return undefined
    }
    get iconClass(): string {
      if (this.type === "command") {
        return this._commands.iconClass(this.command, this.args)
      }
      if (this.type === "submenu" && this.submenu) {
        return this.submenu.title.iconClass
      }
      return ""
    }
    get iconLabel(): string {
      if (this.type === "command") {
        return this._commands.iconLabel(this.command, this.args)
      }
      if (this.type === "submenu" && this.submenu) {
        return this.submenu.title.iconLabel
      }
      return ""
    }
    get caption(): string {
      if (this.type === "command") {
        return this._commands.caption(this.command, this.args)
      }
      if (this.type === "submenu" && this.submenu) {
        return this.submenu.title.caption
      }
      return ""
    }
    get className(): string {
      if (this.type === "command") {
        return this._commands.className(this.command, this.args)
      }
      if (this.type === "submenu" && this.submenu) {
        return this.submenu.title.className
      }
      return ""
    }
    get dataset(): CommandRegistry.Dataset {
      if (this.type === "command") {
        return this._commands.dataset(this.command, this.args)
      }
      if (this.type === "submenu" && this.submenu) {
        return this.submenu.title.dataset
      }
      return {}
    }
    get isEnabled(): boolean {
      if (this.type === "command") {
        return this._commands.isEnabled(this.command, this.args)
      }
      if (this.type === "submenu") {
        return this.submenu !== null
      }
      return true
    }
    get isToggled(): boolean {
      if (this.type === "command") {
        return this._commands.isToggled(this.command, this.args)
      }
      return false
    }
    get isVisible(): boolean {
      if (this.type === "command") {
        return this._commands.isVisible(this.command, this.args)
      }
      if (this.type === "submenu") {
        return this.submenu !== null
      }
      return true
    }
    get keyBinding(): CommandRegistry.IKeyBinding | null {
      if (this.type === "command") {
        const { command, args } = this
        return (
          ArrayExt.findLastValue(this._commands.keyBindings, kb => {
            return kb.command === command && JSONExt.deepEqual(kb.args, args)
          }) || null
        )
      }
      return null
    }
    private _commands: CommandRegistry
  }
}
export class MenuBar extends Widget {
  constructor(options: MenuBar.IOptions = {}) {
    super({ node: Private.createNode() })
    this.addClass("lm-MenuBar")
    this.setFlag(Widget.Flag.DisallowLayout)
    this.renderer = options.renderer || MenuBar.defaultRenderer
    this._forceItemsPosition = options.forceItemsPosition || {
      forceX: true,
      forceY: true,
    }
  }
  dispose(): void {
    this._closeChildMenu()
    this._menus.length = 0
    super.dispose()
  }
  readonly renderer: MenuBar.IRenderer
  get childMenu(): Menu | null {
    return this._childMenu
  }
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(
      "lm-MenuBar-content"
    )[0] as HTMLUListElement
  }
  get activeMenu(): Menu | null {
    return this._menus[this._activeIndex] || null
  }
  set activeMenu(value: Menu | null) {
    this.activeIndex = value ? this._menus.indexOf(value) : -1
  }
  get activeIndex(): number {
    return this._activeIndex
  }
  set activeIndex(value: number) {
    if (value < 0 || value >= this._menus.length) {
      value = -1
    }
    if (this._activeIndex === value) {
      return
    }
    this._activeIndex = value
    if (
      this._activeIndex >= 0 &&
      this.contentNode.childNodes[this._activeIndex]
    ) {
      ;(this.contentNode.childNodes[this._activeIndex] as HTMLElement).focus()
    }
    this.update()
  }
  get menus(): ReadonlyArray<Menu> {
    return this._menus
  }
  openActiveMenu(): void {
    if (this._activeIndex === -1) {
      return
    }
    this._openChildMenu()
    if (this._childMenu) {
      this._childMenu.activeIndex = -1
      this._childMenu.activateNextItem()
    }
  }
  addMenu(menu: Menu): void {
    this.insertMenu(this._menus.length, menu)
  }
  insertMenu(index: number, menu: Menu): void {
    this._closeChildMenu()
    const i = this._menus.indexOf(menu)
    let j = Math.max(0, Math.min(index, this._menus.length))
    if (i === -1) {
      ArrayExt.insert(this._menus, j, menu)
      menu.addClass("lm-MenuBar-menu")
      menu.aboutToClose.connect(this._onMenuAboutToClose, this)
      menu.menuRequested.connect(this._onMenuMenuRequested, this)
      menu.title.changed.connect(this._onTitleChanged, this)
      this.update()
      return
    }
    if (j === this._menus.length) {
      j--
    }
    if (i === j) {
      return
    }
    ArrayExt.move(this._menus, i, j)
    this.update()
  }
  removeMenu(menu: Menu): void {
    this.removeMenuAt(this._menus.indexOf(menu))
  }
  removeMenuAt(index: number): void {
    this._closeChildMenu()
    const menu = ArrayExt.removeAt(this._menus, index)
    if (!menu) {
      return
    }
    menu.aboutToClose.disconnect(this._onMenuAboutToClose, this)
    menu.menuRequested.disconnect(this._onMenuMenuRequested, this)
    menu.title.changed.disconnect(this._onTitleChanged, this)
    menu.removeClass("lm-MenuBar-menu")
    this.update()
  }
  clearMenus(): void {
    if (this._menus.length === 0) {
      return
    }
    this._closeChildMenu()
    for (const menu of this._menus) {
      menu.aboutToClose.disconnect(this._onMenuAboutToClose, this)
      menu.menuRequested.disconnect(this._onMenuMenuRequested, this)
      menu.title.changed.disconnect(this._onTitleChanged, this)
      menu.removeClass("lm-MenuBar-menu")
    }
    this._menus.length = 0
    this.update()
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "keydown":
        this._evtKeyDown(event as KeyboardEvent)
        break
      case "mousedown":
        this._evtMouseDown(event as MouseEvent)
        break
      case "mousemove":
        this._evtMouseMove(event as MouseEvent)
        break
      case "mouseleave":
        this._evtMouseLeave(event as MouseEvent)
        break
      case "contextmenu":
        event.preventDefault()
        event.stopPropagation()
        break
    }
  }
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener("keydown", this)
    this.node.addEventListener("mousedown", this)
    this.node.addEventListener("mousemove", this)
    this.node.addEventListener("mouseleave", this)
    this.node.addEventListener("contextmenu", this)
  }
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener("keydown", this)
    this.node.removeEventListener("mousedown", this)
    this.node.removeEventListener("mousemove", this)
    this.node.removeEventListener("mouseleave", this)
    this.node.removeEventListener("contextmenu", this)
    this._closeChildMenu()
  }
  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      this.node.focus()
    }
  }
  protected onUpdateRequest(msg: Message): void {
    const menus = this._menus
    const renderer = this.renderer
    const activeIndex = this._activeIndex
    const content = new Array<VirtualElement>(menus.length)
    for (let i = 0, n = menus.length; i < n; ++i) {
      const title = menus[i].title
      let active = i === activeIndex
      if (active && menus[i].items.length == 0) {
        active = false
      }
      content[i] = renderer.renderItem({
        title,
        active,
        onfocus: () => {
          this.activeIndex = i
        },
      })
    }
    VirtualDOM.render(content, this.contentNode)
  }
  private _evtKeyDown(event: KeyboardEvent): void {
    const kc = event.keyCode
    if (kc === 9) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (kc === 13 || kc === 38 || kc === 40) {
      this.openActiveMenu()
      return
    }
    if (kc === 27) {
      this._closeChildMenu()
      this.activeIndex = -1
      this.node.blur()
      return
    }
    if (kc === 37) {
      const i = this._activeIndex
      const n = this._menus.length
      this.activeIndex = i === 0 ? n - 1 : i - 1
      return
    }
    if (kc === 39) {
      const i = this._activeIndex
      const n = this._menus.length
      this.activeIndex = i === n - 1 ? 0 : i + 1
      return
    }
    const key = getKeyboardLayout().keyForKeydownEvent(event)
    if (!key) {
      return
    }
    const start = this._activeIndex + 1
    const result = Private.findMnemonic(this._menus, key, start)
    if (result.index !== -1 && !result.multiple) {
      this.activeIndex = result.index
      this.openActiveMenu()
    } else if (result.index !== -1) {
      this.activeIndex = result.index
    } else if (result.auto !== -1) {
      this.activeIndex = result.auto
    }
  }
  private _evtMouseDown(event: MouseEvent): void {
    if (!ElementExt.hitTest(this.node, event.clientX, event.clientY)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    const index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return ElementExt.hitTest(node, event.clientX, event.clientY)
    })
    if (index === -1) {
      this._closeChildMenu()
      return
    }
    if (event.button !== 0) {
      return
    }
    if (this._childMenu) {
      this._closeChildMenu()
      this.activeIndex = index
    } else {
      this.activeIndex = index
      this._openChildMenu()
    }
  }
  private _evtMouseMove(event: MouseEvent): void {
    const index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return ElementExt.hitTest(node, event.clientX, event.clientY)
    })
    if (index === this._activeIndex) {
      return
    }
    if (index === -1 && this._childMenu) {
      return
    }
    this.activeIndex = index
    if (this._childMenu) {
      this._openChildMenu()
    }
  }
  private _evtMouseLeave(event: MouseEvent): void {
    if (!this._childMenu) {
      this.activeIndex = -1
    }
  }
  private _openChildMenu(): void {
    const newMenu = this.activeMenu
    if (!newMenu) {
      this._closeChildMenu()
      return
    }
    const oldMenu = this._childMenu
    if (oldMenu === newMenu) {
      return
    }
    this._childMenu = newMenu
    if (oldMenu) {
      oldMenu.close()
    } else {
      this.addClass("lm-mod-active")
      document.addEventListener("mousedown", this, true)
    }
    MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest)
    const itemNode = this.contentNode.children[this._activeIndex]
    const { left, bottom } = (itemNode as HTMLElement).getBoundingClientRect()
    if (newMenu.items.length > 0) {
      newMenu.open(left, bottom, this._forceItemsPosition)
    }
  }
  private _closeChildMenu(): void {
    if (!this._childMenu) {
      return
    }
    this.removeClass("lm-mod-active")
    document.removeEventListener("mousedown", this, true)
    const menu = this._childMenu
    this._childMenu = null
    menu.close()
    this.activeIndex = -1
  }
  private _onMenuAboutToClose(sender: Menu): void {
    if (sender !== this._childMenu) {
      return
    }
    this.removeClass("lm-mod-active")
    document.removeEventListener("mousedown", this, true)
    this._childMenu = null
    this.activeIndex = -1
  }
  private _onMenuMenuRequested(sender: Menu, args: "next" | "previous"): void {
    if (sender !== this._childMenu) {
      return
    }
    const i = this._activeIndex
    const n = this._menus.length
    switch (args) {
      case "next":
        this.activeIndex = i === n - 1 ? 0 : i + 1
        break
      case "previous":
        this.activeIndex = i === 0 ? n - 1 : i - 1
        break
    }
    this.openActiveMenu()
  }
  private _onTitleChanged(): void {
    this.update()
  }
  private _activeIndex = -1
  private _forceItemsPosition: Menu.IOpenOptions
  private _menus: Menu[] = []
  private _childMenu: Menu | null = null
}
export namespace MenuBar {
  export interface IOptions {
    renderer?: IRenderer
    forceItemsPosition?: Menu.IOpenOptions
  }
  export interface IRenderData {
    readonly title: Title<Widget>
    readonly active: boolean
    readonly onfocus?: (event: FocusEvent) => void
  }
  export interface IRenderer {
    renderItem(data: IRenderData): VirtualElement
  }
  export class Renderer implements IRenderer {
    renderItem(data: IRenderData): VirtualElement {
      const className = this.createItemClass(data)
      const dataset = this.createItemDataset(data)
      const aria = this.createItemARIA(data)
      return h.li(
        { className, dataset, tabindex: "0", onfocus: data.onfocus, ...aria },
        this.renderIcon(data),
        this.renderLabel(data)
      )
    }
    renderIcon(data: IRenderData): VirtualElement {
      const className = this.createIconClass(data)
      return h.div({ className }, data.title.icon!, data.title.iconLabel)
    }
    renderLabel(data: IRenderData): VirtualElement {
      const content = this.formatLabel(data)
      return h.div({ className: "lm-MenuBar-itemLabel" }, content)
    }
    createItemClass(data: IRenderData): string {
      let name = "lm-MenuBar-item"
      if (data.title.className) {
        name += ` ${data.title.className}`
      }
      if (data.active) {
        name += " lm-mod-active"
      }
      return name
    }
    createItemDataset(data: IRenderData): ElementDataset {
      return data.title.dataset
    }
    createItemARIA(data: IRenderData): ElementARIAAttrs {
      return { role: "menuitem", "aria-haspopup": "true" }
    }
    createIconClass(data: IRenderData): string {
      const name = "lm-MenuBar-itemIcon"
      const extra = data.title.iconClass
      return extra ? `${name} ${extra}` : name
    }
    formatLabel(data: IRenderData): h.Child {
      const { label, mnemonic } = data.title
      if (mnemonic < 0 || mnemonic >= label.length) {
        return label
      }
      const prefix = label.slice(0, mnemonic)
      const suffix = label.slice(mnemonic + 1)
      const char = label[mnemonic]
      const span = h.span({ className: "lm-MenuBar-itemMnemonic" }, char)
      return [prefix, span, suffix]
    }
  }
  export const defaultRenderer = new Renderer()
}
namespace Private {
  export function createNode(): HTMLDivElement {
    const node = document.createElement("div")
    const content = document.createElement("ul")
    content.className = "lm-MenuBar-content"
    node.appendChild(content)
    content.setAttribute("role", "menubar")
    node.tabIndex = 0
    content.tabIndex = 0
    return node
  }
  export interface IMnemonicResult {
    index: number
    multiple: boolean
    auto: number
  }
  export function findMnemonic(
    menus: ReadonlyArray<Menu>,
    key: string,
    start: number
  ): IMnemonicResult {
    let index = -1
    let auto = -1
    let multiple = false
    const upperKey = key.toUpperCase()
    for (let i = 0, n = menus.length; i < n; ++i) {
      const k = (i + start) % n
      const title = menus[k].title
      if (title.label.length === 0) {
        continue
      }
      const mn = title.mnemonic
      if (mn >= 0 && mn < title.label.length) {
        if (title.label[mn].toUpperCase() === upperKey) {
          if (index === -1) {
            index = k
          } else {
            multiple = true
          }
        }
        continue
      }
      if (auto === -1 && title.label[0].toUpperCase() === upperKey) {
        auto = k
      }
    }
    return { index, multiple, auto }
  }
}
export class Panel extends Widget {
  constructor(options: Panel.IOptions = {}) {
    super()
    this.addClass("lm-Panel")
    this.layout = Private.createLayout(options)
  }
  get widgets(): ReadonlyArray<Widget> {
    return (this.layout as PanelLayout).widgets
  }
  addWidget(widget: Widget): void {
    ;(this.layout as PanelLayout).addWidget(widget)
  }
  insertWidget(index: number, widget: Widget): void {
    ;(this.layout as PanelLayout).insertWidget(index, widget)
  }
}
export namespace Panel {
  export interface IOptions {
    layout?: PanelLayout
  }
}
namespace Private {
  export function createLayout(options: Panel.IOptions): PanelLayout {
    return options.layout || new PanelLayout()
  }
}
export class PanelLayout extends Layout {
  dispose(): void {
    while (this._widgets.length > 0) {
      this._widgets.pop()!.dispose()
    }
    super.dispose()
  }
  get widgets(): ReadonlyArray<Widget> {
    return this._widgets
  }
  *[Symbol.iterator](): IterableIterator<Widget> {
    yield* this._widgets
  }
  addWidget(widget: Widget): void {
    this.insertWidget(this._widgets.length, widget)
  }
  insertWidget(index: number, widget: Widget): void {
    widget.parent = this.parent
    const i = this._widgets.indexOf(widget)
    let j = Math.max(0, Math.min(index, this._widgets.length))
    if (i === -1) {
      ArrayExt.insert(this._widgets, j, widget)
      if (this.parent) {
        this.attachWidget(j, widget)
      }
      return
    }
    if (j === this._widgets.length) {
      j--
    }
    if (i === j) {
      return
    }
    ArrayExt.move(this._widgets, i, j)
    if (this.parent) {
      this.moveWidget(i, j, widget)
    }
  }
  removeWidget(widget: Widget): void {
    this.removeWidgetAt(this._widgets.indexOf(widget))
  }
  removeWidgetAt(index: number): void {
    const widget = ArrayExt.removeAt(this._widgets, index)
    if (widget && this.parent) {
      this.detachWidget(index, widget)
    }
  }
  protected init(): void {
    super.init()
    let index = 0
    for (const widget of this) {
      this.attachWidget(index++, widget)
    }
  }
  protected attachWidget(index: number, widget: Widget): void {
    const ref = this.parent!.node.children[index]
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach)
    }
    this.parent!.node.insertBefore(widget.node, ref)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach)
    }
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach)
    }
    this.parent!.node.removeChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach)
    }
    const ref = this.parent!.node.children[toIndex]
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach)
    }
    this.parent!.node.insertBefore(widget.node, ref)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach)
    }
  }
  protected detachWidget(index: number, widget: Widget): void {
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach)
    }
    this.parent!.node.removeChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach)
    }
  }
  private _widgets: Widget[] = []
}
export class ScrollBar extends Widget {
  constructor(options: ScrollBar.IOptions = {}) {
    super({ node: Private.createNode() })
    this.addClass("lm-ScrollBar")
    this.setFlag(Widget.Flag.DisallowLayout)
    this._orientation = options.orientation || "vertical"
    this.dataset["orientation"] = this._orientation
    if (options.maximum !== undefined) {
      this._maximum = Math.max(0, options.maximum)
    }
    if (options.page !== undefined) {
      this._page = Math.max(0, options.page)
    }
    if (options.value !== undefined) {
      this._value = Math.max(0, Math.min(options.value, this._maximum))
    }
  }
  get thumbMoved(): ISignal<this, number> {
    return this._thumbMoved
  }
  get stepRequested(): ISignal<this, "decrement" | "increment"> {
    return this._stepRequested
  }
  get pageRequested(): ISignal<this, "decrement" | "increment"> {
    return this._pageRequested
  }
  get orientation(): ScrollBar.Orientation {
    return this._orientation
  }
  set orientation(value: ScrollBar.Orientation) {
    if (this._orientation === value) {
      return
    }
    this._releaseMouse()
    this._orientation = value
    this.dataset["orientation"] = value
    this.update()
  }
  get value(): number {
    return this._value
  }
  set value(value: number) {
    value = Math.max(0, Math.min(value, this._maximum))
    if (this._value === value) {
      return
    }
    this._value = value
    this.update()
  }
  get page(): number {
    return this._page
  }
  set page(value: number) {
    value = Math.max(0, value)
    if (this._page === value) {
      return
    }
    this._page = value
    this.update()
  }
  get maximum(): number {
    return this._maximum
  }
  set maximum(value: number) {
    value = Math.max(0, value)
    if (this._maximum === value) {
      return
    }
    this._maximum = value
    this._value = Math.min(this._value, value)
    this.update()
  }
  get decrementNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      "lm-ScrollBar-button"
    )[0] as HTMLDivElement
  }
  get incrementNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      "lm-ScrollBar-button"
    )[1] as HTMLDivElement
  }
  get trackNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      "lm-ScrollBar-track"
    )[0] as HTMLDivElement
  }
  get thumbNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      "lm-ScrollBar-thumb"
    )[0] as HTMLDivElement
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "mousedown":
        this._evtMouseDown(event as MouseEvent)
        break
      case "mousemove":
        this._evtMouseMove(event as MouseEvent)
        break
      case "mouseup":
        this._evtMouseUp(event as MouseEvent)
        break
      case "keydown":
        this._evtKeyDown(event as KeyboardEvent)
        break
      case "contextmenu":
        event.preventDefault()
        event.stopPropagation()
        break
    }
  }
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener("mousedown", this)
    this.update()
  }
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener("mousedown", this)
    this._releaseMouse()
  }
  protected onUpdateRequest(msg: Message): void {
    let value = (this._value * 100) / this._maximum
    let page = (this._page * 100) / (this._page + this._maximum)
    value = Math.max(0, Math.min(value, 100))
    page = Math.max(0, Math.min(page, 100))
    const thumbStyle = this.thumbNode.style
    if (this._orientation === "horizontal") {
      thumbStyle.top = ""
      thumbStyle.height = ""
      thumbStyle.left = `${value}%`
      thumbStyle.width = `${page}%`
      thumbStyle.transform = `translate(${-value}%, 0%)`
    } else {
      thumbStyle.left = ""
      thumbStyle.width = ""
      thumbStyle.top = `${value}%`
      thumbStyle.height = `${page}%`
      thumbStyle.transform = `translate(0%, ${-value}%)`
    }
  }
  private _evtKeyDown(event: KeyboardEvent): void {
    event.preventDefault()
    event.stopPropagation()
    if (event.keyCode !== 27) {
      return
    }
    const value = this._pressData ? this._pressData.value : -1
    this._releaseMouse()
    if (value !== -1) {
      this._moveThumb(value)
    }
  }
  private _evtMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    this.activate()
    if (this._pressData) {
      return
    }
    const part = Private.findPart(this, event.target as HTMLElement)
    if (!part) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const override = Drag.overrideCursor("default")
    this._pressData = {
      part,
      override,
      delta: -1,
      value: -1,
      mouseX: event.clientX,
      mouseY: event.clientY,
    }
    document.addEventListener("mousemove", this, true)
    document.addEventListener("mouseup", this, true)
    document.addEventListener("keydown", this, true)
    document.addEventListener("contextmenu", this, true)
    if (part === "thumb") {
      const thumbNode = this.thumbNode
      const thumbRect = thumbNode.getBoundingClientRect()
      if (this._orientation === "horizontal") {
        this._pressData.delta = event.clientX - thumbRect.left
      } else {
        this._pressData.delta = event.clientY - thumbRect.top
      }
      thumbNode.classList.add("lm-mod-active")
      this._pressData.value = this._value
      return
    }
    if (part === "track") {
      const thumbRect = this.thumbNode.getBoundingClientRect()
      let dir: "decrement" | "increment"
      if (this._orientation === "horizontal") {
        dir = event.clientX < thumbRect.left ? "decrement" : "increment"
      } else {
        dir = event.clientY < thumbRect.top ? "decrement" : "increment"
      }
      this._repeatTimer = window.setTimeout(this._onRepeat, 350)
      this._pageRequested.emit(dir)
      return
    }
    if (part === "decrement") {
      this.decrementNode.classList.add("lm-mod-active")
      this._repeatTimer = window.setTimeout(this._onRepeat, 350)
      this._stepRequested.emit("decrement")
      return
    }
    if (part === "increment") {
      this.incrementNode.classList.add("lm-mod-active")
      this._repeatTimer = window.setTimeout(this._onRepeat, 350)
      this._stepRequested.emit("increment")
      return
    }
  }
  private _evtMouseMove(event: MouseEvent): void {
    if (!this._pressData) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this._pressData.mouseX = event.clientX
    this._pressData.mouseY = event.clientY
    if (this._pressData.part !== "thumb") {
      return
    }
    const thumbRect = this.thumbNode.getBoundingClientRect()
    const trackRect = this.trackNode.getBoundingClientRect()
    let trackPos: number
    let trackSpan: number
    if (this._orientation === "horizontal") {
      trackPos = event.clientX - trackRect.left - this._pressData.delta
      trackSpan = trackRect.width - thumbRect.width
    } else {
      trackPos = event.clientY - trackRect.top - this._pressData.delta
      trackSpan = trackRect.height - thumbRect.height
    }
    const value = trackSpan === 0 ? 0 : (trackPos * this._maximum) / trackSpan
    this._moveThumb(value)
  }
  private _evtMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this._releaseMouse()
  }
  private _releaseMouse(): void {
    if (!this._pressData) {
      return
    }
    clearTimeout(this._repeatTimer)
    this._repeatTimer = -1
    this._pressData.override.dispose()
    this._pressData = null
    document.removeEventListener("mousemove", this, true)
    document.removeEventListener("mouseup", this, true)
    document.removeEventListener("keydown", this, true)
    document.removeEventListener("contextmenu", this, true)
    this.thumbNode.classList.remove("lm-mod-active")
    this.decrementNode.classList.remove("lm-mod-active")
    this.incrementNode.classList.remove("lm-mod-active")
  }
  private _moveThumb(value: number): void {
    value = Math.max(0, Math.min(value, this._maximum))
    if (this._value === value) {
      return
    }
    this._value = value
    this.update()
    this._thumbMoved.emit(value)
  }
  private _onRepeat = () => {
    this._repeatTimer = -1
    if (!this._pressData) {
      return
    }
    const part = this._pressData.part
    if (part === "thumb") {
      return
    }
    this._repeatTimer = window.setTimeout(this._onRepeat, 20)
    const mouseX = this._pressData.mouseX
    const mouseY = this._pressData.mouseY
    if (part === "decrement") {
      if (!ElementExt.hitTest(this.decrementNode, mouseX, mouseY)) {
        return
      }
      this._stepRequested.emit("decrement")
      return
    }
    if (part === "increment") {
      if (!ElementExt.hitTest(this.incrementNode, mouseX, mouseY)) {
        return
      }
      this._stepRequested.emit("increment")
      return
    }
    if (part === "track") {
      if (!ElementExt.hitTest(this.trackNode, mouseX, mouseY)) {
        return
      }
      const thumbNode = this.thumbNode
      if (ElementExt.hitTest(thumbNode, mouseX, mouseY)) {
        return
      }
      const thumbRect = thumbNode.getBoundingClientRect()
      let dir: "decrement" | "increment"
      if (this._orientation === "horizontal") {
        dir = mouseX < thumbRect.left ? "decrement" : "increment"
      } else {
        dir = mouseY < thumbRect.top ? "decrement" : "increment"
      }
      this._pageRequested.emit(dir)
      return
    }
  }
  private _value = 0
  private _page = 10
  private _maximum = 100
  private _repeatTimer = -1
  private _orientation: ScrollBar.Orientation
  private _pressData: Private.IPressData | null = null
  private _thumbMoved = new Signal<this, number>(this)
  private _stepRequested = new Signal<this, "decrement" | "increment">(this)
  private _pageRequested = new Signal<this, "decrement" | "increment">(this)
}
export namespace ScrollBar {
  export type Orientation = "horizontal" | "vertical"
  export interface IOptions {
    orientation?: Orientation
    value?: number
    page?: number
    maximum?: number
  }
}
namespace Private {
  export type ScrollBarPart = "thumb" | "track" | "decrement" | "increment"
  export interface IPressData {
    part: ScrollBarPart
    delta: number
    value: number
    override: IDisposable
    mouseX: number
    mouseY: number
  }
  export function createNode(): HTMLElement {
    const node = document.createElement("div")
    const decrement = document.createElement("div")
    const increment = document.createElement("div")
    const track = document.createElement("div")
    const thumb = document.createElement("div")
    decrement.className = "lm-ScrollBar-button"
    increment.className = "lm-ScrollBar-button"
    decrement.dataset["action"] = "decrement"
    increment.dataset["action"] = "increment"
    track.className = "lm-ScrollBar-track"
    thumb.className = "lm-ScrollBar-thumb"
    track.appendChild(thumb)
    node.appendChild(decrement)
    node.appendChild(track)
    node.appendChild(increment)
    return node
  }
  export function findPart(
    scrollBar: ScrollBar,
    target: HTMLElement
  ): ScrollBarPart | null {
    if (scrollBar.thumbNode.contains(target)) {
      return "thumb"
    }
    if (scrollBar.trackNode.contains(target)) {
      return "track"
    }
    if (scrollBar.decrementNode.contains(target)) {
      return "decrement"
    }
    if (scrollBar.incrementNode.contains(target)) {
      return "increment"
    }
    return null
  }
}
export class SingletonLayout extends Layout {
  dispose(): void {
    if (this._widget) {
      const widget = this._widget
      this._widget = null
      widget.dispose()
    }
    super.dispose()
  }
  get widget(): Widget | null {
    return this._widget
  }
  set widget(widget: Widget | null) {
    if (widget) {
      widget.parent = this.parent
    }
    if (this._widget === widget) {
      return
    }
    if (this._widget) {
      this._widget.dispose()
    }
    this._widget = widget
    if (this.parent && widget) {
      this.attachWidget(widget)
    }
  }
  *[Symbol.iterator](): IterableIterator<Widget> {
    if (this._widget) {
      yield this._widget
    }
  }
  removeWidget(widget: Widget): void {
    if (this._widget !== widget) {
      return
    }
    this._widget = null
    if (this.parent) {
      this.detachWidget(widget)
    }
  }
  protected init(): void {
    super.init()
    for (const widget of this) {
      this.attachWidget(widget)
    }
  }
  protected attachWidget(widget: Widget): void {
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach)
    }
    this.parent!.node.appendChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach)
    }
  }
  protected detachWidget(widget: Widget): void {
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach)
    }
    this.parent!.node.removeChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach)
    }
  }
  private _widget: Widget | null = null
}
export class SplitLayout extends PanelLayout {
  constructor(options: SplitLayout.IOptions) {
    super()
    this.renderer = options.renderer
    if (options.orientation !== undefined) {
      this._orientation = options.orientation
    }
    if (options.alignment !== undefined) {
      this._alignment = options.alignment
    }
    if (options.spacing !== undefined) {
      this._spacing = Utils.clampDimension(options.spacing)
    }
  }
  dispose(): void {
    for (const item of this._items) {
      item.dispose()
    }
    this._box = null
    this._items.length = 0
    this._sizers.length = 0
    this._handles.length = 0
    super.dispose()
  }
  readonly renderer: SplitLayout.IRenderer
  get orientation(): SplitLayout.Orientation {
    return this._orientation
  }
  set orientation(value: SplitLayout.Orientation) {
    if (this._orientation === value) {
      return
    }
    this._orientation = value
    if (!this.parent) {
      return
    }
    this.parent.dataset["orientation"] = value
    this.parent.fit()
  }
  get alignment(): SplitLayout.Alignment {
    return this._alignment
  }
  set alignment(value: SplitLayout.Alignment) {
    if (this._alignment === value) {
      return
    }
    this._alignment = value
    if (!this.parent) {
      return
    }
    this.parent.dataset["alignment"] = value
    this.parent.update()
  }
  get spacing(): number {
    return this._spacing
  }
  set spacing(value: number) {
    value = Utils.clampDimension(value)
    if (this._spacing === value) {
      return
    }
    this._spacing = value
    if (!this.parent) {
      return
    }
    this.parent.fit()
  }
  get handles(): ReadonlyArray<HTMLDivElement> {
    return this._handles
  }
  absoluteSizes(): number[] {
    return this._sizers.map(sizer => sizer.size)
  }
  relativeSizes(): number[] {
    return Private.normalize(this._sizers.map(sizer => sizer.size))
  }
  setRelativeSizes(sizes: number[], update = true): void {
    const n = this._sizers.length
    const temp = sizes.slice(0, n)
    while (temp.length < n) {
      temp.push(0)
    }
    const normed = Private.normalize(temp)
    for (let i = 0; i < n; ++i) {
      const sizer = this._sizers[i]
      sizer.sizeHint = normed[i]
      sizer.size = normed[i]
    }
    this._hasNormedSizes = true
    if (update && this.parent) {
      this.parent.update()
    }
  }
  moveHandle(index: number, position: number): void {
    const handle = this._handles[index]
    if (!handle || handle.classList.contains("lm-mod-hidden")) {
      return
    }
    let delta: number
    if (this._orientation === "horizontal") {
      delta = position - handle.offsetLeft
    } else {
      delta = position - handle.offsetTop
    }
    if (delta === 0) {
      return
    }
    for (const sizer of this._sizers) {
      if (sizer.size > 0) {
        sizer.sizeHint = sizer.size
      }
    }
    BoxEngine.adjust(this._sizers, index, delta)
    if (this.parent) {
      this.parent.update()
    }
  }
  protected init(): void {
    this.parent!.dataset["orientation"] = this.orientation
    this.parent!.dataset["alignment"] = this.alignment
    super.init()
  }
  protected attachWidget(index: number, widget: Widget): void {
    const item = new LayoutItem(widget)
    const handle = Private.createHandle(this.renderer)
    const average = Private.averageSize(this._sizers)
    const sizer = Private.createSizer(average)
    ArrayExt.insert(this._items, index, item)
    ArrayExt.insert(this._sizers, index, sizer)
    ArrayExt.insert(this._handles, index, handle)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach)
    }
    this.parent!.node.appendChild(widget.node)
    this.parent!.node.appendChild(handle)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach)
    }
    this.parent!.fit()
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    ArrayExt.move(this._items, fromIndex, toIndex)
    ArrayExt.move(this._sizers, fromIndex, toIndex)
    ArrayExt.move(this._handles, fromIndex, toIndex)
    this.parent!.fit()
  }
  protected detachWidget(index: number, widget: Widget): void {
    const item = ArrayExt.removeAt(this._items, index)
    const handle = ArrayExt.removeAt(this._handles, index)
    ArrayExt.removeAt(this._sizers, index)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach)
    }
    this.parent!.node.removeChild(widget.node)
    this.parent!.node.removeChild(handle!)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach)
    }
    item!.dispose()
    this.parent!.fit()
  }
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg)
    this.parent!.update()
  }
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg)
    this.parent!.fit()
  }
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height)
    }
  }
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1)
    }
  }
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit()
    }
  }
  protected updateItemPosition(
    i: number,
    isHorizontal: boolean,
    left: number,
    top: number,
    height: number,
    width: number,
    size: number
  ): void {
    const item = this._items[i]
    if (item.isHidden) {
      return
    }
    const handleStyle = this._handles[i].style
    if (isHorizontal) {
      left += this.widgetOffset
      item.update(left, top, size, height)
      left += size
      handleStyle.top = `${top}px`
      handleStyle.left = `${left}px`
      handleStyle.width = `${this._spacing}px`
      handleStyle.height = `${height}px`
    } else {
      top += this.widgetOffset
      item.update(left, top, width, size)
      top += size
      handleStyle.top = `${top}px`
      handleStyle.left = `${left}px`
      handleStyle.width = `${width}px`
      handleStyle.height = `${this._spacing}px`
    }
  }
  private _fit(): void {
    let nVisible = 0
    let lastHandleIndex = -1
    for (let i = 0, n = this._items.length; i < n; ++i) {
      if (this._items[i].isHidden) {
        this._handles[i].classList.add("lm-mod-hidden")
      } else {
        this._handles[i].classList.remove("lm-mod-hidden")
        lastHandleIndex = i
        nVisible++
      }
    }
    if (lastHandleIndex !== -1) {
      this._handles[lastHandleIndex].classList.add("lm-mod-hidden")
    }
    this._fixed =
      this._spacing * Math.max(0, nVisible - 1) +
      this.widgetOffset * this._items.length
    const horz = this._orientation === "horizontal"
    let minW = horz ? this._fixed : 0
    let minH = horz ? 0 : this._fixed
    for (let i = 0, n = this._items.length; i < n; ++i) {
      const item = this._items[i]
      const sizer = this._sizers[i]
      if (sizer.size > 0) {
        sizer.sizeHint = sizer.size
      }
      if (item.isHidden) {
        sizer.minSize = 0
        sizer.maxSize = 0
        continue
      }
      item.fit()
      sizer.stretch = SplitLayout.getStretch(item.widget)
      if (horz) {
        sizer.minSize = item.minWidth
        sizer.maxSize = item.maxWidth
        minW += item.minWidth
        minH = Math.max(minH, item.minHeight)
      } else {
        sizer.minSize = item.minHeight
        sizer.maxSize = item.maxHeight
        minH += item.minHeight
        minW = Math.max(minW, item.minWidth)
      }
    }
    const box = (this._box = ElementExt.boxSizing(this.parent!.node))
    minW += box.horizontalSum
    minH += box.verticalSum
    const style = this.parent!.node.style
    style.minWidth = `${minW}px`
    style.minHeight = `${minH}px`
    this._dirty = true
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest)
    }
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest)
    }
  }
  private _update(offsetWidth: number, offsetHeight: number): void {
    this._dirty = false
    let nVisible = 0
    for (let i = 0, n = this._items.length; i < n; ++i) {
      nVisible += +!this._items[i].isHidden
    }
    if (nVisible === 0 && this.widgetOffset === 0) {
      return
    }
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight
    }
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node)
    }
    let top = this._box.paddingTop
    let left = this._box.paddingLeft
    const width = offsetWidth - this._box.horizontalSum
    const height = offsetHeight - this._box.verticalSum
    let extra = 0
    let offset = 0
    const horz = this._orientation === "horizontal"
    if (nVisible > 0) {
      let space: number
      if (horz) {
        space = Math.max(0, width - this._fixed)
      } else {
        space = Math.max(0, height - this._fixed)
      }
      if (this._hasNormedSizes) {
        for (const sizer of this._sizers) {
          sizer.sizeHint *= space
        }
        this._hasNormedSizes = false
      }
      const delta = BoxEngine.calc(this._sizers, space)
      if (delta > 0) {
        switch (this._alignment) {
          case "start":
            break
          case "center":
            extra = 0
            offset = delta / 2
            break
          case "end":
            extra = 0
            offset = delta
            break
          case "justify":
            extra = delta / nVisible
            offset = 0
            break
          default:
            throw "unreachable"
        }
      }
    }
    for (let i = 0, n = this._items.length; i < n; ++i) {
      const item = this._items[i]
      const size = item.isHidden ? 0 : this._sizers[i].size + extra
      this.updateItemPosition(
        i,
        horz,
        horz ? left + offset : left,
        horz ? top : top + offset,
        height,
        width,
        size
      )
      const fullOffset =
        this.widgetOffset +
        (this._handles[i].classList.contains("lm-mod-hidden")
          ? 0
          : this._spacing)
      if (horz) {
        left += size + fullOffset
      } else {
        top += size + fullOffset
      }
    }
  }
  protected widgetOffset = 0
  private _fixed = 0
  private _spacing = 4
  private _dirty = false
  private _hasNormedSizes = false
  private _sizers: BoxSizer[] = []
  private _items: LayoutItem[] = []
  private _handles: HTMLDivElement[] = []
  private _box: ElementExt.IBoxSizing | null = null
  private _alignment: SplitLayout.Alignment = "start"
  private _orientation: SplitLayout.Orientation = "horizontal"
}
export namespace SplitLayout {
  export type Orientation = "horizontal" | "vertical"
  export type Alignment = "start" | "center" | "end" | "justify"
  export interface IOptions {
    renderer: IRenderer
    orientation?: Orientation
    alignment?: Alignment
    spacing?: number
  }
  export interface IRenderer {
    createHandle(): HTMLDivElement
  }
  export function getStretch(widget: Widget): number {
    return Private.stretchProperty.get(widget)
  }
  export function setStretch(widget: Widget, value: number): void {
    Private.stretchProperty.set(widget, value)
  }
}
namespace Private {
  export const stretchProperty = new AttachedProperty<Widget, number>({
    name: "stretch",
    create: () => 0,
    coerce: (owner, value) => Math.max(0, Math.floor(value)),
    changed: onChildSizingChanged,
  })
  export function createSizer(size: number): BoxSizer {
    const sizer = new BoxSizer()
    sizer.sizeHint = Math.floor(size)
    return sizer
  }
  export function createHandle(
    renderer: SplitLayout.IRenderer
  ): HTMLDivElement {
    const handle = renderer.createHandle()
    handle.style.position = "absolute"
    return handle
  }
  export function averageSize(sizers: BoxSizer[]): number {
    return sizers.reduce((v, s) => v + s.size, 0) / sizers.length || 0
  }
  export function normalize(values: number[]): number[] {
    const n = values.length
    if (n === 0) {
      return []
    }
    const sum = values.reduce((a, b) => a + Math.abs(b), 0)
    return sum === 0 ? values.map(v => 1 / n) : values.map(v => v / sum)
  }
  function onChildSizingChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof SplitLayout) {
      child.parent.fit()
    }
  }
}
export class SplitPanel extends Panel {
  constructor(options: SplitPanel.IOptions = {}) {
    super({ layout: Private.createLayout(options) })
    this.addClass("lm-SplitPanel")
  }
  dispose(): void {
    this._releaseMouse()
    super.dispose()
  }
  get orientation(): SplitPanel.Orientation {
    return (this.layout as SplitLayout).orientation
  }
  set orientation(value: SplitPanel.Orientation) {
    ;(this.layout as SplitLayout).orientation = value
  }
  get alignment(): SplitPanel.Alignment {
    return (this.layout as SplitLayout).alignment
  }
  set alignment(value: SplitPanel.Alignment) {
    ;(this.layout as SplitLayout).alignment = value
  }
  get spacing(): number {
    return (this.layout as SplitLayout).spacing
  }
  set spacing(value: number) {
    ;(this.layout as SplitLayout).spacing = value
  }
  get renderer(): SplitPanel.IRenderer {
    return (this.layout as SplitLayout).renderer
  }
  get handleMoved(): ISignal<this, void> {
    return this._handleMoved
  }
  get handles(): ReadonlyArray<HTMLDivElement> {
    return (this.layout as SplitLayout).handles
  }
  relativeSizes(): number[] {
    return (this.layout as SplitLayout).relativeSizes()
  }
  setRelativeSizes(sizes: number[], update = true): void {
    ;(this.layout as SplitLayout).setRelativeSizes(sizes, update)
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "pointerdown":
        this._evtPointerDown(event as PointerEvent)
        break
      case "pointermove":
        this._evtPointerMove(event as PointerEvent)
        break
      case "pointerup":
        this._evtPointerUp(event as PointerEvent)
        break
      case "keydown":
        this._evtKeyDown(event as KeyboardEvent)
        break
      case "contextmenu":
        event.preventDefault()
        event.stopPropagation()
        break
    }
  }
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener("pointerdown", this)
  }
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener("pointerdown", this)
    this._releaseMouse()
  }
  protected onChildAdded(msg: Widget.ChildMessage): void {
    msg.child.addClass("lm-SplitPanel-child")
    this._releaseMouse()
  }
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    msg.child.removeClass("lm-SplitPanel-child")
    this._releaseMouse()
  }
  private _evtKeyDown(event: KeyboardEvent): void {
    if (this._pressData) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (event.keyCode === 27) {
      this._releaseMouse()
    }
  }
  private _evtPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return
    }
    const layout = this.layout as SplitLayout
    const index = ArrayExt.findFirstIndex(layout.handles, handle => {
      return handle.contains(event.target as HTMLElement)
    })
    if (index === -1) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    document.addEventListener("pointerup", this, true)
    document.addEventListener("pointermove", this, true)
    document.addEventListener("keydown", this, true)
    document.addEventListener("contextmenu", this, true)
    let delta: number
    const handle = layout.handles[index]
    const rect = handle.getBoundingClientRect()
    if (layout.orientation === "horizontal") {
      delta = event.clientX - rect.left
    } else {
      delta = event.clientY - rect.top
    }
    const style = window.getComputedStyle(handle)
    const override = Drag.overrideCursor(style.cursor!)
    this._pressData = { index, delta, override }
  }
  private _evtPointerMove(event: PointerEvent): void {
    event.preventDefault()
    event.stopPropagation()
    let pos: number
    const layout = this.layout as SplitLayout
    const rect = this.node.getBoundingClientRect()
    if (layout.orientation === "horizontal") {
      pos = event.clientX - rect.left - this._pressData!.delta
    } else {
      pos = event.clientY - rect.top - this._pressData!.delta
    }
    layout.moveHandle(this._pressData!.index, pos)
  }
  private _evtPointerUp(event: PointerEvent): void {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this._releaseMouse()
  }
  private _releaseMouse(): void {
    if (!this._pressData) {
      return
    }
    this._pressData.override.dispose()
    this._pressData = null
    this._handleMoved.emit()
    document.removeEventListener("keydown", this, true)
    document.removeEventListener("pointerup", this, true)
    document.removeEventListener("pointermove", this, true)
    document.removeEventListener("contextmenu", this, true)
  }
  private _handleMoved = new Signal<any, void>(this)
  private _pressData: Private.IPressData | null = null
}
export namespace SplitPanel {
  export type Orientation = SplitLayout.Orientation
  export type Alignment = SplitLayout.Alignment
  export type IRenderer = SplitLayout.IRenderer
  export interface IOptions {
    renderer?: IRenderer
    orientation?: Orientation
    alignment?: Alignment
    spacing?: number
    layout?: SplitLayout
  }
  export class Renderer implements IRenderer {
    createHandle(): HTMLDivElement {
      const handle = document.createElement("div")
      handle.className = "lm-SplitPanel-handle"
      return handle
    }
  }
  export const defaultRenderer = new Renderer()
  export function getStretch(widget: Widget): number {
    return SplitLayout.getStretch(widget)
  }
  export function setStretch(widget: Widget, value: number): void {
    SplitLayout.setStretch(widget, value)
  }
}
namespace Private {
  export interface IPressData {
    index: number
    delta: number
    override: IDisposable
  }
  export function createLayout(options: SplitPanel.IOptions): SplitLayout {
    return (
      options.layout ||
      new SplitLayout({
        renderer: options.renderer || SplitPanel.defaultRenderer,
        orientation: options.orientation,
        alignment: options.alignment,
        spacing: options.spacing,
      })
    )
  }
}
export class StackedLayout extends PanelLayout {
  constructor(options: StackedLayout.IOptions = {}) {
    super(options)
    this._hiddenMode =
      options.hiddenMode !== undefined
        ? options.hiddenMode
        : Widget.HiddenMode.Display
  }
  get hiddenMode(): Widget.HiddenMode {
    return this._hiddenMode
  }
  set hiddenMode(v: Widget.HiddenMode) {
    if (this._hiddenMode === v) {
      return
    }
    this._hiddenMode = v
    if (this.widgets.length > 1) {
      this.widgets.forEach(w => {
        w.hiddenMode = this._hiddenMode
      })
    }
  }
  dispose(): void {
    for (const item of this._items) {
      item.dispose()
    }
    this._box = null
    this._items.length = 0
    super.dispose()
  }
  protected attachWidget(index: number, widget: Widget): void {
    if (
      this._hiddenMode === Widget.HiddenMode.Scale &&
      this._items.length > 0
    ) {
      if (this._items.length === 1) {
        this.widgets[0].hiddenMode = Widget.HiddenMode.Scale
      }
      widget.hiddenMode = Widget.HiddenMode.Scale
    } else {
      widget.hiddenMode = Widget.HiddenMode.Display
    }
    ArrayExt.insert(this._items, index, new LayoutItem(widget))
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach)
    }
    this.parent!.node.appendChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach)
    }
    this.parent!.fit()
  }
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    ArrayExt.move(this._items, fromIndex, toIndex)
    this.parent!.update()
  }
  protected detachWidget(index: number, widget: Widget): void {
    const item = ArrayExt.removeAt(this._items, index)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach)
    }
    this.parent!.node.removeChild(widget.node)
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach)
    }
    item!.widget.node.style.zIndex = ""
    if (this._hiddenMode === Widget.HiddenMode.Scale) {
      widget.hiddenMode = Widget.HiddenMode.Display
      if (this._items.length === 1) {
        this._items[0].widget.hiddenMode = Widget.HiddenMode.Display
      }
    }
    item!.dispose()
    this.parent!.fit()
  }
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg)
    this.parent!.update()
  }
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg)
    this.parent!.fit()
  }
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit()
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height)
    }
  }
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1)
    }
  }
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit()
    }
  }
  private _fit(): void {
    let minW = 0
    let minH = 0
    for (let i = 0, n = this._items.length; i < n; ++i) {
      const item = this._items[i]
      if (item.isHidden) {
        continue
      }
      item.fit()
      minW = Math.max(minW, item.minWidth)
      minH = Math.max(minH, item.minHeight)
    }
    const box = (this._box = ElementExt.boxSizing(this.parent!.node))
    minW += box.horizontalSum
    minH += box.verticalSum
    const style = this.parent!.node.style
    style.minWidth = `${minW}px`
    style.minHeight = `${minH}px`
    this._dirty = true
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest)
    }
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest)
    }
  }
  private _update(offsetWidth: number, offsetHeight: number): void {
    this._dirty = false
    let nVisible = 0
    for (let i = 0, n = this._items.length; i < n; ++i) {
      nVisible += +!this._items[i].isHidden
    }
    if (nVisible === 0) {
      return
    }
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight
    }
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node)
    }
    const top = this._box.paddingTop
    const left = this._box.paddingLeft
    const width = offsetWidth - this._box.horizontalSum
    const height = offsetHeight - this._box.verticalSum
    for (let i = 0, n = this._items.length; i < n; ++i) {
      const item = this._items[i]
      if (item.isHidden) {
        continue
      }
      item.widget.node.style.zIndex = `${i}`
      item.update(left, top, width, height)
    }
  }
  private _dirty = false
  private _items: LayoutItem[] = []
  private _box: ElementExt.IBoxSizing | null = null
  private _hiddenMode: Widget.HiddenMode
}
export namespace StackedLayout {
  export interface IOptions extends Layout.IOptions {
    hiddenMode?: Widget.HiddenMode
  }
}
export class StackedPanel extends Panel {
  constructor(options: StackedPanel.IOptions = {}) {
    super({ layout: Private.createLayout(options) })
    this.addClass("lm-StackedPanel")
  }
  get hiddenMode(): Widget.HiddenMode {
    return (this.layout as StackedLayout).hiddenMode
  }
  set hiddenMode(v: Widget.HiddenMode) {
    ;(this.layout as StackedLayout).hiddenMode = v
  }
  get widgetRemoved(): ISignal<this, Widget> {
    return this._widgetRemoved
  }
  protected onChildAdded(msg: Widget.ChildMessage): void {
    msg.child.addClass("lm-StackedPanel-child")
  }
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    msg.child.removeClass("lm-StackedPanel-child")
    this._widgetRemoved.emit(msg.child)
  }
  private _widgetRemoved = new Signal<this, Widget>(this)
}
export namespace StackedPanel {
  export interface IOptions {
    layout?: StackedLayout
  }
}
namespace Private {
  export function createLayout(options: StackedPanel.IOptions): StackedLayout {
    return options.layout || new StackedLayout()
  }
}
export class TabBar<T> extends Widget {
  constructor(options: TabBar.IOptions<T> = {}) {
    super({ node: Private.createNode() })
    this.addClass("lm-TabBar")
    this.contentNode.setAttribute("role", "tablist")
    this.setFlag(Widget.Flag.DisallowLayout)
    this._document = options.document || document
    this.tabsMovable = options.tabsMovable || false
    this.titlesEditable = options.titlesEditable || false
    this.allowDeselect = options.allowDeselect || false
    this.addButtonEnabled = options.addButtonEnabled || false
    this.insertBehavior = options.insertBehavior || "select-tab-if-needed"
    this.name = options.name || ""
    this.orientation = options.orientation || "horizontal"
    this.removeBehavior = options.removeBehavior || "select-tab-after"
    this.renderer = options.renderer || TabBar.defaultRenderer
  }
  dispose(): void {
    this._releaseMouse()
    this._titles.length = 0
    this._previousTitle = null
    super.dispose()
  }
  get currentChanged(): ISignal<this, TabBar.ICurrentChangedArgs<T>> {
    return this._currentChanged
  }
  get tabMoved(): ISignal<this, TabBar.ITabMovedArgs<T>> {
    return this._tabMoved
  }
  get tabActivateRequested(): ISignal<
    this,
    TabBar.ITabActivateRequestedArgs<T>
  > {
    return this._tabActivateRequested
  }
  get addRequested(): ISignal<this, void> {
    return this._addRequested
  }
  get tabCloseRequested(): ISignal<this, TabBar.ITabCloseRequestedArgs<T>> {
    return this._tabCloseRequested
  }
  get tabDetachRequested(): ISignal<this, TabBar.ITabDetachRequestedArgs<T>> {
    return this._tabDetachRequested
  }
  readonly renderer: TabBar.IRenderer<T>
  get document(): Document | ShadowRoot {
    return this._document
  }
  tabsMovable: boolean
  get titlesEditable(): boolean {
    return this._titlesEditable
  }
  set titlesEditable(value: boolean) {
    this._titlesEditable = value
  }
  allowDeselect: boolean
  insertBehavior: TabBar.InsertBehavior
  removeBehavior: TabBar.RemoveBehavior
  get currentTitle(): Title<T> | null {
    return this._titles[this._currentIndex] || null
  }
  set currentTitle(value: Title<T> | null) {
    this.currentIndex = value ? this._titles.indexOf(value) : -1
  }
  get currentIndex(): number {
    return this._currentIndex
  }
  set currentIndex(value: number) {
    if (value < 0 || value >= this._titles.length) {
      value = -1
    }
    if (this._currentIndex === value) {
      return
    }
    const pi = this._currentIndex
    const pt = this._titles[pi] || null
    const ci = value
    const ct = this._titles[ci] || null
    this._currentIndex = ci
    this._previousTitle = pt
    this.update()
    this._currentChanged.emit({
      previousIndex: pi,
      previousTitle: pt,
      currentIndex: ci,
      currentTitle: ct,
    })
  }
  get name(): string {
    return this._name
  }
  set name(value: string) {
    this._name = value
    if (value) {
      this.contentNode.setAttribute("aria-label", value)
    } else {
      this.contentNode.removeAttribute("aria-label")
    }
  }
  get orientation(): TabBar.Orientation {
    return this._orientation
  }
  set orientation(value: TabBar.Orientation) {
    if (this._orientation === value) {
      return
    }
    this._releaseMouse()
    this._orientation = value
    this.dataset["orientation"] = value
    this.contentNode.setAttribute("aria-orientation", value)
  }
  get addButtonEnabled(): boolean {
    return this._addButtonEnabled
  }
  set addButtonEnabled(value: boolean) {
    if (this._addButtonEnabled === value) {
      return
    }
    this._addButtonEnabled = value
    if (value) {
      this.addButtonNode.classList.remove("lm-mod-hidden")
    } else {
      this.addButtonNode.classList.add("lm-mod-hidden")
    }
  }
  get titles(): ReadonlyArray<Title<T>> {
    return this._titles
  }
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(
      "lm-TabBar-content"
    )[0] as HTMLUListElement
  }
  get addButtonNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      "lm-TabBar-addButton"
    )[0] as HTMLDivElement
  }
  addTab(value: Title<T> | Title.IOptions<T>): Title<T> {
    return this.insertTab(this._titles.length, value)
  }
  insertTab(index: number, value: Title<T> | Title.IOptions<T>): Title<T> {
    this._releaseMouse()
    const title = Private.asTitle(value)
    const i = this._titles.indexOf(title)
    let j = Math.max(0, Math.min(index, this._titles.length))
    if (i === -1) {
      ArrayExt.insert(this._titles, j, title)
      title.changed.connect(this._onTitleChanged, this)
      this.update()
      this._adjustCurrentForInsert(j, title)
      return title
    }
    if (j === this._titles.length) {
      j--
    }
    if (i === j) {
      return title
    }
    ArrayExt.move(this._titles, i, j)
    this.update()
    this._adjustCurrentForMove(i, j)
    return title
  }
  removeTab(title: Title<T>): void {
    this.removeTabAt(this._titles.indexOf(title))
  }
  removeTabAt(index: number): void {
    this._releaseMouse()
    const title = ArrayExt.removeAt(this._titles, index)
    if (!title) {
      return
    }
    title.changed.disconnect(this._onTitleChanged, this)
    if (title === this._previousTitle) {
      this._previousTitle = null
    }
    this.update()
    this._adjustCurrentForRemove(index, title)
  }
  clearTabs(): void {
    if (this._titles.length === 0) {
      return
    }
    this._releaseMouse()
    for (const title of this._titles) {
      title.changed.disconnect(this._onTitleChanged, this)
    }
    const pi = this.currentIndex
    const pt = this.currentTitle
    this._currentIndex = -1
    this._previousTitle = null
    this._titles.length = 0
    this.update()
    if (pi === -1) {
      return
    }
    this._currentChanged.emit({
      previousIndex: pi,
      previousTitle: pt,
      currentIndex: -1,
      currentTitle: null,
    })
  }
  releaseMouse(): void {
    this._releaseMouse()
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "pointerdown":
        this._evtPointerDown(event as PointerEvent)
        break
      case "pointermove":
        this._evtPointerMove(event as PointerEvent)
        break
      case "pointerup":
        this._evtPointerUp(event as PointerEvent)
        break
      case "dblclick":
        this._evtDblClick(event as MouseEvent)
        break
      case "keydown":
        this._evtKeyDown(event as KeyboardEvent)
        break
      case "contextmenu":
        event.preventDefault()
        event.stopPropagation()
        break
    }
  }
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener("pointerdown", this)
    this.node.addEventListener("dblclick", this)
  }
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener("pointerdown", this)
    this.node.removeEventListener("dblclick", this)
    this._releaseMouse()
  }
  protected onUpdateRequest(msg: Message): void {
    const titles = this._titles
    const renderer = this.renderer
    const currentTitle = this.currentTitle
    const content = new Array<VirtualElement>(titles.length)
    for (let i = 0, n = titles.length; i < n; ++i) {
      const title = titles[i]
      const current = title === currentTitle
      const zIndex = current ? n : n - i - 1
      content[i] = renderer.renderTab({ title, current, zIndex })
    }
    VirtualDOM.render(content, this.contentNode)
  }
  private _evtDblClick(event: MouseEvent): void {
    if (!this.titlesEditable) {
      return
    }
    const tabs = this.contentNode.children
    const index = ArrayExt.findFirstIndex(tabs, tab => {
      return ElementExt.hitTest(tab, event.clientX, event.clientY)
    })
    if (index === -1) {
      return
    }
    const title = this.titles[index]
    const label = tabs[index].querySelector(
      ".lm-TabBar-tabLabel"
    ) as HTMLElement
    if (label && label.contains(event.target as HTMLElement)) {
      const value = title.label || ""
      const oldValue = label.innerHTML
      label.innerHTML = ""
      const input = document.createElement("input")
      input.classList.add("lm-TabBar-tabInput")
      input.value = value
      label.appendChild(input)
      const onblur = () => {
        input.removeEventListener("blur", onblur)
        label.innerHTML = oldValue
      }
      input.addEventListener("dblclick", (event: Event) =>
        event.stopPropagation()
      )
      input.addEventListener("blur", onblur)
      input.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          if (input.value !== "") {
            title.label = title.caption = input.value
          }
          onblur()
        } else if (event.key === "Escape") {
          onblur()
        }
      })
      input.select()
      input.focus()
      if (label.children.length > 0) {
        ;(label.children[0] as HTMLElement).focus()
      }
    }
  }
  private _evtKeyDown(event: KeyboardEvent): void {
    event.preventDefault()
    event.stopPropagation()
    if (event.keyCode === 27) {
      this._releaseMouse()
    }
  }
  private _evtPointerDown(event: PointerEvent | MouseEvent): void {
    if (event.button !== 0 && event.button !== 1) {
      return
    }
    if (this._dragData) {
      return
    }
    const addButtonClicked =
      this.addButtonEnabled &&
      this.addButtonNode.contains(event.target as HTMLElement)
    const tabs = this.contentNode.children
    const index = ArrayExt.findFirstIndex(tabs, tab => {
      return ElementExt.hitTest(tab, event.clientX, event.clientY)
    })
    if (index === -1 && !addButtonClicked) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this._dragData = {
      tab: tabs[index] as HTMLElement,
      index: index,
      pressX: event.clientX,
      pressY: event.clientY,
      tabPos: -1,
      tabSize: -1,
      tabPressPos: -1,
      targetIndex: -1,
      tabLayout: null,
      contentRect: null,
      override: null,
      dragActive: false,
      dragAborted: false,
      detachRequested: false,
    }
    this.document.addEventListener("pointerup", this, true)
    if (event.button === 1 || addButtonClicked) {
      return
    }
    const icon = tabs[index].querySelector(this.renderer.closeIconSelector)
    if (icon && icon.contains(event.target as HTMLElement)) {
      return
    }
    if (this.tabsMovable) {
      this.document.addEventListener("pointermove", this, true)
      this.document.addEventListener("keydown", this, true)
      this.document.addEventListener("contextmenu", this, true)
    }
    if (this.allowDeselect && this.currentIndex === index) {
      this.currentIndex = -1
    } else {
      this.currentIndex = index
    }
    if (this.currentIndex === -1) {
      return
    }
    this._tabActivateRequested.emit({
      index: this.currentIndex,
      title: this.currentTitle!,
    })
  }
  private _evtPointerMove(event: PointerEvent | MouseEvent): void {
    const data = this._dragData
    if (!data) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const tabs = this.contentNode.children
    if (!data.dragActive && !Private.dragExceeded(data, event)) {
      return
    }
    if (!data.dragActive) {
      const tabRect = data.tab.getBoundingClientRect()
      if (this._orientation === "horizontal") {
        data.tabPos = data.tab.offsetLeft
        data.tabSize = tabRect.width
        data.tabPressPos = data.pressX - tabRect.left
      } else {
        data.tabPos = data.tab.offsetTop
        data.tabSize = tabRect.height
        data.tabPressPos = data.pressY - tabRect.top
      }
      data.tabLayout = Private.snapTabLayout(tabs, this._orientation)
      data.contentRect = this.contentNode.getBoundingClientRect()
      data.override = Drag.overrideCursor("default")
      data.tab.classList.add("lm-mod-dragging")
      this.addClass("lm-mod-dragging")
      data.dragActive = true
    }
    if (!data.detachRequested && Private.detachExceeded(data, event)) {
      data.detachRequested = true
      const index = data.index
      const clientX = event.clientX
      const clientY = event.clientY
      const tab = tabs[index] as HTMLElement
      const title = this._titles[index]
      this._tabDetachRequested.emit({ index, title, tab, clientX, clientY })
      if (data.dragAborted) {
        return
      }
    }
    Private.layoutTabs(tabs, data, event, this._orientation)
  }
  private _evtPointerUp(event: PointerEvent | MouseEvent): void {
    if (event.button !== 0 && event.button !== 1) {
      return
    }
    const data = this._dragData
    if (!data) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this.document.removeEventListener("pointermove", this, true)
    this.document.removeEventListener("pointerup", this, true)
    this.document.removeEventListener("keydown", this, true)
    this.document.removeEventListener("contextmenu", this, true)
    if (!data.dragActive) {
      this._dragData = null
      const addButtonClicked =
        this.addButtonEnabled &&
        this.addButtonNode.contains(event.target as HTMLElement)
      if (addButtonClicked) {
        this._addRequested.emit(undefined)
        return
      }
      const tabs = this.contentNode.children
      const index = ArrayExt.findFirstIndex(tabs, tab => {
        return ElementExt.hitTest(tab, event.clientX, event.clientY)
      })
      if (index !== data.index) {
        return
      }
      const title = this._titles[index]
      if (!title.closable) {
        return
      }
      if (event.button === 1) {
        this._tabCloseRequested.emit({ index, title })
        return
      }
      const icon = tabs[index].querySelector(this.renderer.closeIconSelector)
      if (icon && icon.contains(event.target as HTMLElement)) {
        this._tabCloseRequested.emit({ index, title })
        return
      }
      return
    }
    if (event.button !== 0) {
      return
    }
    Private.finalizeTabPosition(data, this._orientation)
    data.tab.classList.remove("lm-mod-dragging")
    const duration = Private.parseTransitionDuration(data.tab)
    setTimeout(() => {
      if (data.dragAborted) {
        return
      }
      this._dragData = null
      Private.resetTabPositions(this.contentNode.children, this._orientation)
      data.override!.dispose()
      this.removeClass("lm-mod-dragging")
      const i = data.index
      const j = data.targetIndex
      if (j === -1 || i === j) {
        return
      }
      ArrayExt.move(this._titles, i, j)
      this._adjustCurrentForMove(i, j)
      this._tabMoved.emit({
        fromIndex: i,
        toIndex: j,
        title: this._titles[j],
      })
      MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest)
    }, duration)
  }
  private _releaseMouse(): void {
    const data = this._dragData
    if (!data) {
      return
    }
    this._dragData = null
    this.document.removeEventListener("pointermove", this, true)
    this.document.removeEventListener("pointerup", this, true)
    this.document.removeEventListener("keydown", this, true)
    this.document.removeEventListener("contextmenu", this, true)
    data.dragAborted = true
    if (!data.dragActive) {
      return
    }
    Private.resetTabPositions(this.contentNode.children, this._orientation)
    data.override!.dispose()
    data.tab.classList.remove("lm-mod-dragging")
    this.removeClass("lm-mod-dragging")
  }
  private _adjustCurrentForInsert(i: number, title: Title<T>): void {
    const ct = this.currentTitle
    const ci = this._currentIndex
    const bh = this.insertBehavior
    if (bh === "select-tab" || (bh === "select-tab-if-needed" && ci === -1)) {
      this._currentIndex = i
      this._previousTitle = ct
      this._currentChanged.emit({
        previousIndex: ci,
        previousTitle: ct,
        currentIndex: i,
        currentTitle: title,
      })
      return
    }
    if (ci >= i) {
      this._currentIndex++
    }
  }
  private _adjustCurrentForMove(i: number, j: number): void {
    if (this._currentIndex === i) {
      this._currentIndex = j
    } else if (this._currentIndex < i && this._currentIndex >= j) {
      this._currentIndex++
    } else if (this._currentIndex > i && this._currentIndex <= j) {
      this._currentIndex--
    }
  }
  private _adjustCurrentForRemove(i: number, title: Title<T>): void {
    const ci = this._currentIndex
    const bh = this.removeBehavior
    if (ci !== i) {
      if (ci > i) {
        this._currentIndex--
      }
      return
    }
    if (this._titles.length === 0) {
      this._currentIndex = -1
      this._currentChanged.emit({
        previousIndex: i,
        previousTitle: title,
        currentIndex: -1,
        currentTitle: null,
      })
      return
    }
    if (bh === "select-tab-after") {
      this._currentIndex = Math.min(i, this._titles.length - 1)
      this._currentChanged.emit({
        previousIndex: i,
        previousTitle: title,
        currentIndex: this._currentIndex,
        currentTitle: this.currentTitle,
      })
      return
    }
    if (bh === "select-tab-before") {
      this._currentIndex = Math.max(0, i - 1)
      this._currentChanged.emit({
        previousIndex: i,
        previousTitle: title,
        currentIndex: this._currentIndex,
        currentTitle: this.currentTitle,
      })
      return
    }
    if (bh === "select-previous-tab") {
      if (this._previousTitle) {
        this._currentIndex = this._titles.indexOf(this._previousTitle)
        this._previousTitle = null
      } else {
        this._currentIndex = Math.min(i, this._titles.length - 1)
      }
      this._currentChanged.emit({
        previousIndex: i,
        previousTitle: title,
        currentIndex: this._currentIndex,
        currentTitle: this.currentTitle,
      })
      return
    }
    this._currentIndex = -1
    this._currentChanged.emit({
      previousIndex: i,
      previousTitle: title,
      currentIndex: -1,
      currentTitle: null,
    })
  }
  private _onTitleChanged(sender: Title<T>): void {
    this.update()
  }
  private _name: string
  private _currentIndex = -1
  private _titles: Title<T>[] = []
  private _orientation: TabBar.Orientation
  private _document: Document | ShadowRoot
  private _titlesEditable: boolean = false
  private _previousTitle: Title<T> | null = null
  private _dragData: Private.IDragData | null = null
  private _addButtonEnabled: boolean = false
  private _tabMoved = new Signal<this, TabBar.ITabMovedArgs<T>>(this)
  private _currentChanged = new Signal<this, TabBar.ICurrentChangedArgs<T>>(
    this
  )
  private _addRequested = new Signal<this, void>(this)
  private _tabCloseRequested = new Signal<
    this,
    TabBar.ITabCloseRequestedArgs<T>
  >(this)
  private _tabDetachRequested = new Signal<
    this,
    TabBar.ITabDetachRequestedArgs<T>
  >(this)
  private _tabActivateRequested = new Signal<
    this,
    TabBar.ITabActivateRequestedArgs<T>
  >(this)
}
export namespace TabBar {
  export type Orientation = "horizontal" | "vertical"
  export type InsertBehavior = "none" | "select-tab" | "select-tab-if-needed"
  export type RemoveBehavior =
    | "none"
    | "select-tab-after"
    | "select-tab-before"
    | "select-previous-tab"
  export interface IOptions<T> {
    document?: Document | ShadowRoot
    name?: string
    orientation?: TabBar.Orientation
    tabsMovable?: boolean
    allowDeselect?: boolean
    titlesEditable?: boolean
    addButtonEnabled?: boolean
    insertBehavior?: TabBar.InsertBehavior
    removeBehavior?: TabBar.RemoveBehavior
    renderer?: IRenderer<T>
  }
  export interface ICurrentChangedArgs<T> {
    readonly previousIndex: number
    readonly previousTitle: Title<T> | null
    readonly currentIndex: number
    readonly currentTitle: Title<T> | null
  }
  export interface ITabMovedArgs<T> {
    readonly fromIndex: number
    readonly toIndex: number
    readonly title: Title<T>
  }
  export interface ITabActivateRequestedArgs<T> {
    readonly index: number
    readonly title: Title<T>
  }
  export interface ITabCloseRequestedArgs<T> {
    readonly index: number
    readonly title: Title<T>
  }
  export interface ITabDetachRequestedArgs<T> {
    readonly index: number
    readonly title: Title<T>
    readonly tab: HTMLElement
    readonly clientX: number
    readonly clientY: number
  }
  export interface IRenderData<T> {
    readonly title: Title<T>
    readonly current: boolean
    readonly zIndex: number
  }
  export interface IRenderer<T> {
    readonly closeIconSelector: string
    renderTab(data: IRenderData<T>): VirtualElement
  }
  export class Renderer implements IRenderer<any> {
    readonly closeIconSelector = ".lm-TabBar-tabCloseIcon"
    renderTab(data: IRenderData<any>): VirtualElement {
      const title = data.title.caption
      const key = this.createTabKey(data)
      const id = key
      const style = this.createTabStyle(data)
      const className = this.createTabClass(data)
      const dataset = this.createTabDataset(data)
      const aria = this.createTabARIA(data)
      if (data.title.closable) {
        return h.li(
          { id, key, className, title, style, dataset, ...aria },
          this.renderIcon(data),
          this.renderLabel(data),
          this.renderCloseIcon(data)
        )
      } else {
        return h.li(
          { id, key, className, title, style, dataset, ...aria },
          this.renderIcon(data),
          this.renderLabel(data)
        )
      }
    }
    renderIcon(data: IRenderData<any>): VirtualElement {
      const { title } = data
      const className = this.createIconClass(data)
      return h.div({ className }, title.icon!, title.iconLabel)
    }
    renderLabel(data: IRenderData<any>): VirtualElement {
      return h.div({ className: "lm-TabBar-tabLabel" }, data.title.label)
    }
    renderCloseIcon(data: IRenderData<any>): VirtualElement {
      return h.div({ className: "lm-TabBar-tabCloseIcon" })
    }
    createTabKey(data: IRenderData<any>): string {
      let key = this._tabKeys.get(data.title)
      if (key === undefined) {
        key = `tab-key-${this._tabID++}`
        this._tabKeys.set(data.title, key)
      }
      return key
    }
    createTabStyle(data: IRenderData<any>): ElementInlineStyle {
      return { zIndex: `${data.zIndex}` }
    }
    createTabClass(data: IRenderData<any>): string {
      let name = "lm-TabBar-tab"
      if (data.title.className) {
        name += ` ${data.title.className}`
      }
      if (data.title.closable) {
        name += " lm-mod-closable"
      }
      if (data.current) {
        name += " lm-mod-current"
      }
      return name
    }
    createTabDataset(data: IRenderData<any>): ElementDataset {
      return data.title.dataset
    }
    createTabARIA(data: IRenderData<any>): ElementARIAAttrs {
      return { role: "tab", "aria-selected": data.current.toString() }
    }
    createIconClass(data: IRenderData<any>): string {
      const name = "lm-TabBar-tabIcon"
      const extra = data.title.iconClass
      return extra ? `${name} ${extra}` : name
    }
    private _tabID = 0
    private _tabKeys = new WeakMap<Title<any>, string>()
  }
  export const defaultRenderer = new Renderer()
  export const addButtonSelector = ".lm-TabBar-addButton"
}
namespace Private {
  export const DRAG_THRESHOLD = 5
  export const DETACH_THRESHOLD = 20
  export interface IDragData {
    tab: HTMLElement
    index: number
    pressX: number
    pressY: number
    tabPos: number
    tabSize: number
    tabPressPos: number
    targetIndex: number
    tabLayout: ITabLayout[] | null
    contentRect: DOMRect | null
    override: IDisposable | null
    dragActive: boolean
    dragAborted: boolean
    detachRequested: boolean
  }
  export interface ITabLayout {
    margin: number
    pos: number
    size: number
  }
  export function createNode(): HTMLDivElement {
    const node = document.createElement("div")
    const content = document.createElement("ul")
    content.setAttribute("role", "tablist")
    content.className = "lm-TabBar-content"
    node.appendChild(content)
    const add = document.createElement("div")
    add.className = "lm-TabBar-addButton lm-mod-hidden"
    node.appendChild(add)
    return node
  }
  export function asTitle<T>(value: Title<T> | Title.IOptions<T>): Title<T> {
    return value instanceof Title ? value : new Title<T>(value)
  }
  export function parseTransitionDuration(tab: HTMLElement): number {
    const style = window.getComputedStyle(tab)
    return 1000 * (parseFloat(style.transitionDuration!) || 0)
  }
  export function snapTabLayout(
    tabs: HTMLCollection,
    orientation: TabBar.Orientation
  ): ITabLayout[] {
    const layout = new Array<ITabLayout>(tabs.length)
    for (let i = 0, n = tabs.length; i < n; ++i) {
      const node = tabs[i] as HTMLElement
      const style = window.getComputedStyle(node)
      if (orientation === "horizontal") {
        layout[i] = {
          pos: node.offsetLeft,
          size: node.offsetWidth,
          margin: parseFloat(style.marginLeft!) || 0,
        }
      } else {
        layout[i] = {
          pos: node.offsetTop,
          size: node.offsetHeight,
          margin: parseFloat(style.marginTop!) || 0,
        }
      }
    }
    return layout
  }
  export function dragExceeded(data: IDragData, event: MouseEvent): boolean {
    const dx = Math.abs(event.clientX - data.pressX)
    const dy = Math.abs(event.clientY - data.pressY)
    return dx >= DRAG_THRESHOLD || dy >= DRAG_THRESHOLD
  }
  export function detachExceeded(data: IDragData, event: MouseEvent): boolean {
    const rect = data.contentRect!
    return (
      event.clientX < rect.left - DETACH_THRESHOLD ||
      event.clientX >= rect.right + DETACH_THRESHOLD ||
      event.clientY < rect.top - DETACH_THRESHOLD ||
      event.clientY >= rect.bottom + DETACH_THRESHOLD
    )
  }
  export function layoutTabs(
    tabs: HTMLCollection,
    data: IDragData,
    event: MouseEvent,
    orientation: TabBar.Orientation
  ): void {
    let pressPos: number
    let localPos: number
    let clientPos: number
    let clientSize: number
    if (orientation === "horizontal") {
      pressPos = data.pressX
      localPos = event.clientX - data.contentRect!.left
      clientPos = event.clientX
      clientSize = data.contentRect!.width
    } else {
      pressPos = data.pressY
      localPos = event.clientY - data.contentRect!.top
      clientPos = event.clientY
      clientSize = data.contentRect!.height
    }
    let targetIndex = data.index
    const targetPos = localPos - data.tabPressPos
    const targetEnd = targetPos + data.tabSize
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let pxPos: string
      const layout = data.tabLayout![i]
      const threshold = layout.pos + (layout.size >> 1)
      if (i < data.index && targetPos < threshold) {
        pxPos = `${data.tabSize + data.tabLayout![i + 1].margin}px`
        targetIndex = Math.min(targetIndex, i)
      } else if (i > data.index && targetEnd > threshold) {
        pxPos = `${-data.tabSize - layout.margin}px`
        targetIndex = Math.max(targetIndex, i)
      } else if (i === data.index) {
        const ideal = clientPos - pressPos
        const limit = clientSize - (data.tabPos + data.tabSize)
        pxPos = `${Math.max(-data.tabPos, Math.min(ideal, limit))}px`
      } else {
        pxPos = ""
      }
      if (orientation === "horizontal") {
        ;(tabs[i] as HTMLElement).style.left = pxPos
      } else {
        ;(tabs[i] as HTMLElement).style.top = pxPos
      }
    }
    data.targetIndex = targetIndex
  }
  export function finalizeTabPosition(
    data: IDragData,
    orientation: TabBar.Orientation
  ): void {
    let clientSize: number
    if (orientation === "horizontal") {
      clientSize = data.contentRect!.width
    } else {
      clientSize = data.contentRect!.height
    }
    let ideal: number
    if (data.targetIndex === data.index) {
      ideal = 0
    } else if (data.targetIndex > data.index) {
      const tgt = data.tabLayout![data.targetIndex]
      ideal = tgt.pos + tgt.size - data.tabSize - data.tabPos
    } else {
      const tgt = data.tabLayout![data.targetIndex]
      ideal = tgt.pos - data.tabPos
    }
    const limit = clientSize - (data.tabPos + data.tabSize)
    const final = Math.max(-data.tabPos, Math.min(ideal, limit))
    if (orientation === "horizontal") {
      data.tab.style.left = `${final}px`
    } else {
      data.tab.style.top = `${final}px`
    }
  }
  export function resetTabPositions(
    tabs: HTMLCollection,
    orientation: TabBar.Orientation
  ): void {
    for (const tab of tabs) {
      if (orientation === "horizontal") {
        ;(tab as HTMLElement).style.left = ""
      } else {
        ;(tab as HTMLElement).style.top = ""
      }
    }
  }
}
export class TabPanel extends Widget {
  constructor(options: TabPanel.IOptions = {}) {
    super()
    this.addClass("lm-TabPanel")
    this.tabBar = new TabBar<Widget>(options)
    this.tabBar.addClass("lm-TabPanel-tabBar")
    this.stackedPanel = new StackedPanel()
    this.stackedPanel.addClass("lm-TabPanel-stackedPanel")
    this.tabBar.tabMoved.connect(this._onTabMoved, this)
    this.tabBar.currentChanged.connect(this._onCurrentChanged, this)
    this.tabBar.tabCloseRequested.connect(this._onTabCloseRequested, this)
    this.tabBar.tabActivateRequested.connect(this._onTabActivateRequested, this)
    this.tabBar.addRequested.connect(this._onTabAddRequested, this)
    this.stackedPanel.widgetRemoved.connect(this._onWidgetRemoved, this)
    this._tabPlacement = options.tabPlacement || "top"
    const direction = Private.directionFromPlacement(this._tabPlacement)
    const orientation = Private.orientationFromPlacement(this._tabPlacement)
    this.tabBar.orientation = orientation
    this.tabBar.dataset["placement"] = this._tabPlacement
    const layout = new BoxLayout({ direction, spacing: 0 })
    BoxLayout.setStretch(this.tabBar, 0)
    BoxLayout.setStretch(this.stackedPanel, 1)
    layout.addWidget(this.tabBar)
    layout.addWidget(this.stackedPanel)
    this.layout = layout
  }
  get currentChanged(): ISignal<this, TabPanel.ICurrentChangedArgs> {
    return this._currentChanged
  }
  get currentIndex(): number {
    return this.tabBar.currentIndex
  }
  set currentIndex(value: number) {
    this.tabBar.currentIndex = value
  }
  get currentWidget(): Widget | null {
    const title = this.tabBar.currentTitle
    return title ? title.owner : null
  }
  set currentWidget(value: Widget | null) {
    this.tabBar.currentTitle = value ? value.title : null
  }
  get tabsMovable(): boolean {
    return this.tabBar.tabsMovable
  }
  set tabsMovable(value: boolean) {
    this.tabBar.tabsMovable = value
  }
  get addButtonEnabled(): boolean {
    return this.tabBar.addButtonEnabled
  }
  set addButtonEnabled(value: boolean) {
    this.tabBar.addButtonEnabled = value
  }
  get tabPlacement(): TabPanel.TabPlacement {
    return this._tabPlacement
  }
  set tabPlacement(value: TabPanel.TabPlacement) {
    if (this._tabPlacement === value) {
      return
    }
    this._tabPlacement = value
    const direction = Private.directionFromPlacement(value)
    const orientation = Private.orientationFromPlacement(value)
    this.tabBar.orientation = orientation
    this.tabBar.dataset["placement"] = value
    ;(this.layout as BoxLayout).direction = direction
  }
  get addRequested(): ISignal<this, TabBar<Widget>> {
    return this._addRequested
  }
  readonly tabBar: TabBar<Widget>
  readonly stackedPanel: StackedPanel
  get widgets(): ReadonlyArray<Widget> {
    return this.stackedPanel.widgets
  }
  addWidget(widget: Widget): void {
    this.insertWidget(this.widgets.length, widget)
  }
  insertWidget(index: number, widget: Widget): void {
    if (widget !== this.currentWidget) {
      widget.hide()
    }
    this.stackedPanel.insertWidget(index, widget)
    this.tabBar.insertTab(index, widget.title)
    widget.node.setAttribute("role", "tabpanel")
    const renderer = this.tabBar.renderer
    if (renderer instanceof TabBar.Renderer) {
      const tabId = renderer.createTabKey({
        title: widget.title,
        current: false,
        zIndex: 0,
      })
      widget.node.setAttribute("aria-labelledby", tabId)
    }
  }
  private _onCurrentChanged(
    sender: TabBar<Widget>,
    args: TabBar.ICurrentChangedArgs<Widget>
  ): void {
    const { previousIndex, previousTitle, currentIndex, currentTitle } = args
    const previousWidget = previousTitle ? previousTitle.owner : null
    const currentWidget = currentTitle ? currentTitle.owner : null
    if (previousWidget) {
      previousWidget.hide()
    }
    if (currentWidget) {
      currentWidget.show()
    }
    this._currentChanged.emit({
      previousIndex,
      previousWidget,
      currentIndex,
      currentWidget,
    })
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush()
    }
  }
  private _onTabAddRequested(sender: TabBar<Widget>, args: void): void {
    this._addRequested.emit(sender)
  }
  private _onTabActivateRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabActivateRequestedArgs<Widget>
  ): void {
    args.title.owner.activate()
  }
  private _onTabCloseRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabCloseRequestedArgs<Widget>
  ): void {
    args.title.owner.close()
  }
  private _onTabMoved(
    sender: TabBar<Widget>,
    args: TabBar.ITabMovedArgs<Widget>
  ): void {
    this.stackedPanel.insertWidget(args.toIndex, args.title.owner)
  }
  private _onWidgetRemoved(sender: StackedPanel, widget: Widget): void {
    widget.node.removeAttribute("role")
    widget.node.removeAttribute("aria-labelledby")
    this.tabBar.removeTab(widget.title)
  }
  private _tabPlacement: TabPanel.TabPlacement
  private _currentChanged = new Signal<this, TabPanel.ICurrentChangedArgs>(this)
  private _addRequested = new Signal<this, TabBar<Widget>>(this)
}
export namespace TabPanel {
  export type TabPlacement = "top" | "left" | "right" | "bottom"
  export interface IOptions {
    document?: Document | ShadowRoot
    tabsMovable?: boolean
    addButtonEnabled?: boolean
    tabPlacement?: TabPlacement
    renderer?: TabBar.IRenderer<Widget>
  }
  export interface ICurrentChangedArgs {
    previousIndex: number
    previousWidget: Widget | null
    currentIndex: number
    currentWidget: Widget | null
  }
}
namespace Private {
  export function orientationFromPlacement(
    plc: TabPanel.TabPlacement
  ): TabBar.Orientation {
    return placementToOrientationMap[plc]
  }
  export function directionFromPlacement(
    plc: TabPanel.TabPlacement
  ): BoxLayout.Direction {
    return placementToDirectionMap[plc]
  }
  const placementToOrientationMap: { [key: string]: TabBar.Orientation } = {
    top: "horizontal",
    left: "vertical",
    right: "vertical",
    bottom: "horizontal",
  }
  const placementToDirectionMap: { [key: string]: BoxLayout.Direction } = {
    top: "top-to-bottom",
    left: "left-to-right",
    right: "right-to-left",
    bottom: "bottom-to-top",
  }
}
export class Title<T> implements IDisposable {
  constructor(options: Title.IOptions<T>) {
    this.owner = options.owner
    if (options.label !== undefined) {
      this._label = options.label
    }
    if (options.mnemonic !== undefined) {
      this._mnemonic = options.mnemonic
    }
    if (options.icon !== undefined) {
      this._icon = options.icon
    }
    if (options.iconClass !== undefined) {
      this._iconClass = options.iconClass
    }
    if (options.iconLabel !== undefined) {
      this._iconLabel = options.iconLabel
    }
    if (options.caption !== undefined) {
      this._caption = options.caption
    }
    if (options.className !== undefined) {
      this._className = options.className
    }
    if (options.closable !== undefined) {
      this._closable = options.closable
    }
    this._dataset = options.dataset || {}
  }
  get changed(): ISignal<this, void> {
    return this._changed
  }
  readonly owner: T
  get label(): string {
    return this._label
  }
  set label(value: string) {
    if (this._label === value) {
      return
    }
    this._label = value
    this._changed.emit(undefined)
  }
  get mnemonic(): number {
    return this._mnemonic
  }
  set mnemonic(value: number) {
    if (this._mnemonic === value) {
      return
    }
    this._mnemonic = value
    this._changed.emit(undefined)
  }
  get icon(): VirtualElement.IRenderer | undefined {
    return this._icon
  }
  set icon(value: VirtualElement.IRenderer | undefined) {
    if (this._icon === value) {
      return
    }
    this._icon = value
    this._changed.emit(undefined)
  }
  get iconClass(): string {
    return this._iconClass
  }
  set iconClass(value: string) {
    if (this._iconClass === value) {
      return
    }
    this._iconClass = value
    this._changed.emit(undefined)
  }
  get iconLabel(): string {
    return this._iconLabel
  }
  set iconLabel(value: string) {
    if (this._iconLabel === value) {
      return
    }
    this._iconLabel = value
    this._changed.emit(undefined)
  }
  get caption(): string {
    return this._caption
  }
  set caption(value: string) {
    if (this._caption === value) {
      return
    }
    this._caption = value
    this._changed.emit(undefined)
  }
  get className(): string {
    return this._className
  }
  set className(value: string) {
    if (this._className === value) {
      return
    }
    this._className = value
    this._changed.emit(undefined)
  }
  get closable(): boolean {
    return this._closable
  }
  set closable(value: boolean) {
    if (this._closable === value) {
      return
    }
    this._closable = value
    this._changed.emit(undefined)
  }
  get dataset(): Title.Dataset {
    return this._dataset
  }
  set dataset(value: Title.Dataset) {
    if (this._dataset === value) {
      return
    }
    this._dataset = value
    this._changed.emit(undefined)
  }
  get isDisposed(): boolean {
    return this._isDisposed
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    this._isDisposed = true
    Signal.clearData(this)
  }
  private _label = ""
  private _caption = ""
  private _mnemonic = -1
  private _icon: VirtualElement.IRenderer | undefined = undefined
  private _iconClass = ""
  private _iconLabel = ""
  private _className = ""
  private _closable = false
  private _dataset: Title.Dataset
  private _changed = new Signal<this, void>(this)
  private _isDisposed = false
}
export namespace Title {
  export type Dataset = { readonly [key: string]: string }
  export interface IOptions<T> {
    owner: T
    label?: string
    mnemonic?: number
    icon?: VirtualElement.IRenderer
    iconClass?: string
    iconLabel?: string
    caption?: string
    className?: string
    closable?: boolean
    dataset?: Dataset
  }
}
export namespace Utils {
  export function clampDimension(value: number): number {
    return Math.max(0, Math.floor(value))
  }
}
export default Utils
export class Widget implements IMessageHandler, IObservableDisposable {
  constructor(options: Widget.IOptions = {}) {
    this.node = Private.createNode(options)
    this.addClass("lm-Widget")
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    this.setFlag(Widget.Flag.IsDisposed)
    this._disposed.emit(undefined)
    if (this.parent) {
      this.parent = null
    } else if (this.isAttached) {
      Widget.detach(this)
    }
    if (this._layout) {
      this._layout.dispose()
      this._layout = null
    }
    this.title.dispose()
    Signal.clearData(this)
    MessageLoop.clearData(this)
    AttachedProperty.clearData(this)
  }
  get disposed(): ISignal<this, void> {
    return this._disposed
  }
  readonly node: HTMLElement
  get isDisposed(): boolean {
    return this.testFlag(Widget.Flag.IsDisposed)
  }
  get isAttached(): boolean {
    return this.testFlag(Widget.Flag.IsAttached)
  }
  get isHidden(): boolean {
    return this.testFlag(Widget.Flag.IsHidden)
  }
  get isVisible(): boolean {
    return this.testFlag(Widget.Flag.IsVisible)
  }
  get title(): Title<Widget> {
    return Private.titleProperty.get(this)
  }
  get id(): string {
    return this.node.id
  }
  set id(value: string) {
    this.node.id = value
  }
  get dataset(): DOMStringMap {
    return this.node.dataset
  }
  get hiddenMode(): Widget.HiddenMode {
    return this._hiddenMode
  }
  set hiddenMode(value: Widget.HiddenMode) {
    if (this._hiddenMode === value) {
      return
    }
    this._hiddenMode = value
    switch (value) {
      case Widget.HiddenMode.Display:
        this.node.style.willChange = "auto"
        break
      case Widget.HiddenMode.Scale:
        this.node.style.willChange = "transform"
        break
    }
    if (this.isHidden) {
      if (value === Widget.HiddenMode.Display) {
        this.addClass("lm-mod-hidden")
        this.node.style.transform = ""
      } else {
        this.node.style.transform = "scale(0)"
        this.removeClass("lm-mod-hidden")
      }
    }
  }
  get parent(): Widget | null {
    return this._parent
  }
  set parent(value: Widget | null) {
    if (this._parent === value) {
      return
    }
    if (value && this.contains(value)) {
      throw new Error("Invalid parent widget.")
    }
    if (this._parent && !this._parent.isDisposed) {
      const msg = new Widget.ChildMessage("child-removed", this)
      MessageLoop.sendMessage(this._parent, msg)
    }
    this._parent = value
    if (this._parent && !this._parent.isDisposed) {
      const msg = new Widget.ChildMessage("child-added", this)
      MessageLoop.sendMessage(this._parent, msg)
    }
    if (!this.isDisposed) {
      MessageLoop.sendMessage(this, Widget.Msg.ParentChanged)
    }
  }
  get layout(): Layout | null {
    return this._layout
  }
  set layout(value: Layout | null) {
    if (this._layout === value) {
      return
    }
    if (this.testFlag(Widget.Flag.DisallowLayout)) {
      throw new Error("Cannot set widget layout.")
    }
    if (this._layout) {
      throw new Error("Cannot change widget layout.")
    }
    if (value!.parent) {
      throw new Error("Cannot change layout parent.")
    }
    this._layout = value
    value!.parent = this
  }
  *children(): IterableIterator<Widget> {
    if (this._layout) {
      yield* this._layout
    }
  }
  contains(widget: Widget): boolean {
    for (let value: Widget | null = widget; value; value = value._parent) {
      if (value === this) {
        return true
      }
    }
    return false
  }
  hasClass(name: string): boolean {
    return this.node.classList.contains(name)
  }
  addClass(name: string): void {
    this.node.classList.add(name)
  }
  removeClass(name: string): void {
    this.node.classList.remove(name)
  }
  toggleClass(name: string, force?: boolean): boolean {
    if (force === true) {
      this.node.classList.add(name)
      return true
    }
    if (force === false) {
      this.node.classList.remove(name)
      return false
    }
    return this.node.classList.toggle(name)
  }
  update(): void {
    MessageLoop.postMessage(this, Widget.Msg.UpdateRequest)
  }
  fit(): void {
    MessageLoop.postMessage(this, Widget.Msg.FitRequest)
  }
  activate(): void {
    MessageLoop.postMessage(this, Widget.Msg.ActivateRequest)
  }
  close(): void {
    MessageLoop.sendMessage(this, Widget.Msg.CloseRequest)
  }
  show(): void {
    if (!this.testFlag(Widget.Flag.IsHidden)) {
      return
    }
    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      MessageLoop.sendMessage(this, Widget.Msg.BeforeShow)
    }
    this.clearFlag(Widget.Flag.IsHidden)
    this.node.removeAttribute("aria-hidden")
    if (this.hiddenMode === Widget.HiddenMode.Display) {
      this.removeClass("lm-mod-hidden")
    } else {
      this.node.style.transform = ""
    }
    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      MessageLoop.sendMessage(this, Widget.Msg.AfterShow)
    }
    if (this.parent) {
      const msg = new Widget.ChildMessage("child-shown", this)
      MessageLoop.sendMessage(this.parent, msg)
    }
  }
  hide(): void {
    if (this.testFlag(Widget.Flag.IsHidden)) {
      return
    }
    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      MessageLoop.sendMessage(this, Widget.Msg.BeforeHide)
    }
    this.setFlag(Widget.Flag.IsHidden)
    this.node.setAttribute("aria-hidden", "true")
    if (this.hiddenMode === Widget.HiddenMode.Display) {
      this.addClass("lm-mod-hidden")
    } else {
      this.node.style.transform = "scale(0)"
    }
    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      MessageLoop.sendMessage(this, Widget.Msg.AfterHide)
    }
    if (this.parent) {
      const msg = new Widget.ChildMessage("child-hidden", this)
      MessageLoop.sendMessage(this.parent, msg)
    }
  }
  setHidden(hidden: boolean): void {
    if (hidden) {
      this.hide()
    } else {
      this.show()
    }
  }
  testFlag(flag: Widget.Flag): boolean {
    return (this._flags & flag) !== 0
  }
  setFlag(flag: Widget.Flag): void {
    this._flags |= flag
  }
  clearFlag(flag: Widget.Flag): void {
    this._flags &= ~flag
  }
  processMessage(msg: Message): void {
    switch (msg.type) {
      case "resize":
        this.notifyLayout(msg)
        this.onResize(msg as Widget.ResizeMessage)
        break
      case "update-request":
        this.notifyLayout(msg)
        this.onUpdateRequest(msg)
        break
      case "fit-request":
        this.notifyLayout(msg)
        this.onFitRequest(msg)
        break
      case "before-show":
        this.notifyLayout(msg)
        this.onBeforeShow(msg)
        break
      case "after-show":
        this.setFlag(Widget.Flag.IsVisible)
        this.notifyLayout(msg)
        this.onAfterShow(msg)
        break
      case "before-hide":
        this.notifyLayout(msg)
        this.onBeforeHide(msg)
        break
      case "after-hide":
        this.clearFlag(Widget.Flag.IsVisible)
        this.notifyLayout(msg)
        this.onAfterHide(msg)
        break
      case "before-attach":
        this.notifyLayout(msg)
        this.onBeforeAttach(msg)
        break
      case "after-attach":
        if (!this.isHidden && (!this.parent || this.parent.isVisible)) {
          this.setFlag(Widget.Flag.IsVisible)
        }
        this.setFlag(Widget.Flag.IsAttached)
        this.notifyLayout(msg)
        this.onAfterAttach(msg)
        break
      case "before-detach":
        this.notifyLayout(msg)
        this.onBeforeDetach(msg)
        break
      case "after-detach":
        this.clearFlag(Widget.Flag.IsVisible)
        this.clearFlag(Widget.Flag.IsAttached)
        this.notifyLayout(msg)
        this.onAfterDetach(msg)
        break
      case "activate-request":
        this.notifyLayout(msg)
        this.onActivateRequest(msg)
        break
      case "close-request":
        this.notifyLayout(msg)
        this.onCloseRequest(msg)
        break
      case "child-added":
        this.notifyLayout(msg)
        this.onChildAdded(msg as Widget.ChildMessage)
        break
      case "child-removed":
        this.notifyLayout(msg)
        this.onChildRemoved(msg as Widget.ChildMessage)
        break
      default:
        this.notifyLayout(msg)
        break
    }
  }
  protected notifyLayout(msg: Message): void {
    if (this._layout) {
      this._layout.processParentMessage(msg)
    }
  }
  protected onCloseRequest(msg: Message): void {
    if (this.parent) {
      this.parent = null
    } else if (this.isAttached) {
      Widget.detach(this)
    }
  }
  protected onResize(msg: Widget.ResizeMessage): void {}
  protected onUpdateRequest(msg: Message): void {}
  protected onFitRequest(msg: Message): void {}
  protected onActivateRequest(msg: Message): void {}
  protected onBeforeShow(msg: Message): void {}
  protected onAfterShow(msg: Message): void {}
  protected onBeforeHide(msg: Message): void {}
  protected onAfterHide(msg: Message): void {}
  protected onBeforeAttach(msg: Message): void {}
  protected onAfterAttach(msg: Message): void {}
  protected onBeforeDetach(msg: Message): void {}
  protected onAfterDetach(msg: Message): void {}
  protected onChildAdded(msg: Widget.ChildMessage): void {}
  protected onChildRemoved(msg: Widget.ChildMessage): void {}
  private _flags = 0
  private _layout: Layout | null = null
  private _parent: Widget | null = null
  private _disposed = new Signal<this, void>(this)
  private _hiddenMode: Widget.HiddenMode = Widget.HiddenMode.Display
}
export namespace Widget {
  export interface IOptions {
    node?: HTMLElement
    tag?: keyof HTMLElementTagNameMap
  }
  export enum HiddenMode {
    Display = 0,
    Scale,
  }
  export enum Flag {
    IsDisposed = 0x1,
    IsAttached = 0x2,
    IsHidden = 0x4,
    IsVisible = 0x8,
    DisallowLayout = 0x10,
  }
  export namespace Msg {
    export const BeforeShow = new Message("before-show")
    export const AfterShow = new Message("after-show")
    export const BeforeHide = new Message("before-hide")
    export const AfterHide = new Message("after-hide")
    export const BeforeAttach = new Message("before-attach")
    export const AfterAttach = new Message("after-attach")
    export const BeforeDetach = new Message("before-detach")
    export const AfterDetach = new Message("after-detach")
    export const ParentChanged = new Message("parent-changed")
    export const UpdateRequest = new ConflatableMessage("update-request")
    export const FitRequest = new ConflatableMessage("fit-request")
    export const ActivateRequest = new ConflatableMessage("activate-request")
    export const CloseRequest = new ConflatableMessage("close-request")
  }
  export class ChildMessage extends Message {
    constructor(type: string, child: Widget) {
      super(type)
      this.child = child
    }
    readonly child: Widget
  }
  export class ResizeMessage extends Message {
    constructor(width: number, height: number) {
      super("resize")
      this.width = width
      this.height = height
    }
    readonly width: number
    readonly height: number
  }
  export namespace ResizeMessage {
    export const UnknownSize = new ResizeMessage(-1, -1)
  }
  export function attach(
    widget: Widget,
    host: HTMLElement,
    ref: HTMLElement | null = null
  ): void {
    if (widget.parent) {
      throw new Error("Cannot attach a child widget.")
    }
    if (widget.isAttached || widget.node.isConnected) {
      throw new Error("Widget is already attached.")
    }
    if (!host.isConnected) {
      throw new Error("Host is not attached.")
    }
    MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach)
    host.insertBefore(widget.node, ref)
    MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach)
  }
  export function detach(widget: Widget): void {
    if (widget.parent) {
      throw new Error("Cannot detach a child widget.")
    }
    if (!widget.isAttached || !widget.node.isConnected) {
      throw new Error("Widget is not attached.")
    }
    MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach)
    widget.node.parentNode!.removeChild(widget.node)
    MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach)
  }
}
namespace Private {
  export const titleProperty = new AttachedProperty<Widget, Title<Widget>>({
    name: "title",
    create: owner => new Title<Widget>({ owner }),
  })
  export function createNode(options: Widget.IOptions): HTMLElement {
    return options.node || document.createElement(options.tag || "div")
  }
}
