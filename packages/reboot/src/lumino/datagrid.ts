/* eslint-disable @typescript-eslint/no-namespace */
import { ArrayExt, some } from "./algorithm.js"
import { ClipboardExt, ElementExt, Platform } from "./domutils.js"
import { Drag } from "./dragdrop.js"
import { getKeyboardLayout } from "./keyboard.js"
import { GridLayout, ScrollBar, Widget } from "./widgets.js"
import type { IDisposable } from "./disposable.js"
import { ISignal, Signal } from "./signaling.js"
import { ReadonlyJSONObject, JSONExt } from "./utils.js"
import {
  ConflatableMessage,
  IMessageHandler,
  Message,
  MessageLoop,
} from "./messaging.js"

export class BasicKeyHandler implements DataGrid.IKeyHandler {
  get isDisposed(): boolean {
    return this._disposed
  }
  dispose(): void {
    this._disposed = true
  }
  onKeyDown(grid: DataGrid, event: KeyboardEvent): void {
    if (
      grid.editable &&
      grid.selectionModel!.cursorRow !== -1 &&
      grid.selectionModel!.cursorColumn !== -1
    ) {
      const input = String.fromCharCode(event.keyCode)
      if (/[a-zA-Z0-9-_ ]/.test(input)) {
        const row = grid.selectionModel!.cursorRow
        const column = grid.selectionModel!.cursorColumn
        const cell: CellEditor.CellConfig = {
          grid: grid,
          row: row,
          column: column,
        }
        grid.editorController!.edit(cell)
        if (getKeyboardLayout().keyForKeydownEvent(event) === "Space") {
          event.stopPropagation()
          event.preventDefault()
        }
        return
      }
    }
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case "ArrowLeft":
        this.onArrowLeft(grid, event)
        break
      case "ArrowRight":
        this.onArrowRight(grid, event)
        break
      case "ArrowUp":
        this.onArrowUp(grid, event)
        break
      case "ArrowDown":
        this.onArrowDown(grid, event)
        break
      case "PageUp":
        this.onPageUp(grid, event)
        break
      case "PageDown":
        this.onPageDown(grid, event)
        break
      case "Escape":
        this.onEscape(grid, event)
        break
      case "Delete":
        this.onDelete(grid, event)
        break
      case "C":
        this.onKeyC(grid, event)
        break
      case "Enter":
        if (grid.selectionModel) {
          grid.moveCursor(event.shiftKey ? "up" : "down")
          grid.scrollToCursor()
        }
        break
      case "Tab":
        if (grid.selectionModel) {
          grid.moveCursor(event.shiftKey ? "left" : "right")
          grid.scrollToCursor()
          event.stopPropagation()
          event.preventDefault()
        }
        break
    }
  }
  protected onArrowLeft(grid: DataGrid, event: KeyboardEvent): void {
    event.preventDefault()
    event.stopPropagation()
    const model = grid.selectionModel
    const shift = event.shiftKey
    const accel = Platform.accelKey(event)
    if (!model && accel) {
      grid.scrollTo(0, grid.scrollY)
      return
    }
    if (!model) {
      grid.scrollByStep("left")
      return
    }
    const mode = model.selectionMode
    if (mode === "row" && accel) {
      grid.scrollTo(0, grid.scrollY)
      return
    }
    if (mode === "row") {
      grid.scrollByStep("left")
      return
    }
    const r = model.cursorRow
    const c = model.cursorColumn
    let cs = model.currentSelection()
    let r1: number
    let r2: number
    let c1: number
    let c2: number
    let cr: number
    let cc: number
    let clear: SelectionModel.ClearMode
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0
      r2 = cs ? cs.r2 : 0
      c1 = cs ? cs.c1 : 0
      c2 = 0
      cr = r
      cc = c
      clear = "current"
    } else if (shift) {
      r1 = cs ? cs.r1 : 0
      r2 = cs ? cs.r2 : 0
      c1 = cs ? cs.c1 : 0
      c2 = cs ? cs.c2 - 1 : 0
      cr = r
      cc = c
      clear = "current"
    } else if (accel) {
      r1 = r
      r2 = r
      c1 = 0
      c2 = 0
      cr = r1
      cc = c1
      clear = "all"
    } else {
      r1 = r
      r2 = r
      c1 = c - 1
      c2 = c - 1
      cr = r1
      cc = c1
      clear = "all"
    }
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear })
    cs = model.currentSelection()
    if (!cs) {
      return
    }
    if (shift || mode === "column") {
      grid.scrollToColumn(cs.c2)
    } else {
      grid.scrollToCursor()
    }
  }
  protected onArrowRight(grid: DataGrid, event: KeyboardEvent): void {
    event.preventDefault()
    event.stopPropagation()
    const model = grid.selectionModel
    const shift = event.shiftKey
    const accel = Platform.accelKey(event)
    if (!model && accel) {
      grid.scrollTo(grid.maxScrollX, grid.scrollY)
      return
    }
    if (!model) {
      grid.scrollByStep("right")
      return
    }
    const mode = model.selectionMode
    if (mode === "row" && accel) {
      grid.scrollTo(grid.maxScrollX, grid.scrollY)
      return
    }
    if (mode === "row") {
      grid.scrollByStep("right")
      return
    }
    const r = model.cursorRow
    const c = model.cursorColumn
    let cs = model.currentSelection()
    let r1: number
    let r2: number
    let c1: number
    let c2: number
    let cr: number
    let cc: number
    let clear: SelectionModel.ClearMode
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0
      r2 = cs ? cs.r2 : 0
      c1 = cs ? cs.c1 : 0
      c2 = Infinity
      cr = r
      cc = c
      clear = "current"
    } else if (shift) {
      r1 = cs ? cs.r1 : 0
      r2 = cs ? cs.r2 : 0
      c1 = cs ? cs.c1 : 0
      c2 = cs ? cs.c2 + 1 : 0
      cr = r
      cc = c
      clear = "current"
    } else if (accel) {
      r1 = r
      r2 = r
      c1 = Infinity
      c2 = Infinity
      cr = r1
      cc = c1
      clear = "all"
    } else {
      r1 = r
      r2 = r
      c1 = c + 1
      c2 = c + 1
      cr = r1
      cc = c1
      clear = "all"
    }
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear })
    cs = model.currentSelection()
    if (!cs) {
      return
    }
    if (shift || mode === "column") {
      grid.scrollToColumn(cs.c2)
    } else {
      grid.scrollToCursor()
    }
  }
  protected onArrowUp(grid: DataGrid, event: KeyboardEvent): void {
    event.preventDefault()
    event.stopPropagation()
    const model = grid.selectionModel
    const shift = event.shiftKey
    const accel = Platform.accelKey(event)
    if (!model && accel) {
      grid.scrollTo(grid.scrollX, 0)
      return
    }
    if (!model) {
      grid.scrollByStep("up")
      return
    }
    const mode = model.selectionMode
    if (mode === "column" && accel) {
      grid.scrollTo(grid.scrollX, 0)
      return
    }
    if (mode === "column") {
      grid.scrollByStep("up")
      return
    }
    const r = model.cursorRow
    const c = model.cursorColumn
    let cs = model.currentSelection()
    let r1: number
    let r2: number
    let c1: number
    let c2: number
    let cr: number
    let cc: number
    let clear: SelectionModel.ClearMode
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0
      r2 = 0
      c1 = cs ? cs.c1 : 0
      c2 = cs ? cs.c2 : 0
      cr = r
      cc = c
      clear = "current"
    } else if (shift) {
      r1 = cs ? cs.r1 : 0
      r2 = cs ? cs.r2 - 1 : 0
      c1 = cs ? cs.c1 : 0
      c2 = cs ? cs.c2 : 0
      cr = r
      cc = c
      clear = "current"
    } else if (accel) {
      r1 = 0
      r2 = 0
      c1 = c
      c2 = c
      cr = r1
      cc = c1
      clear = "all"
    } else {
      r1 = r - 1
      r2 = r - 1
      c1 = c
      c2 = c
      cr = r1
      cc = c1
      clear = "all"
    }
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear })
    cs = model.currentSelection()
    if (!cs) {
      return
    }
    if (shift || mode === "row") {
      grid.scrollToRow(cs.r2)
    } else {
      grid.scrollToCursor()
    }
  }
  protected onArrowDown(grid: DataGrid, event: KeyboardEvent): void {
    event.preventDefault()
    event.stopPropagation()
    const model = grid.selectionModel
    const shift = event.shiftKey
    const accel = Platform.accelKey(event)
    if (!model && accel) {
      grid.scrollTo(grid.scrollX, grid.maxScrollY)
      return
    }
    if (!model) {
      grid.scrollByStep("down")
      return
    }
    const mode = model.selectionMode
    if (mode === "column" && accel) {
      grid.scrollTo(grid.scrollX, grid.maxScrollY)
      return
    }
    if (mode === "column") {
      grid.scrollByStep("down")
      return
    }
    const r = model.cursorRow
    const c = model.cursorColumn
    let cs = model.currentSelection()
    let r1: number
    let r2: number
    let c1: number
    let c2: number
    let cr: number
    let cc: number
    let clear: SelectionModel.ClearMode
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0
      r2 = Infinity
      c1 = cs ? cs.c1 : 0
      c2 = cs ? cs.c2 : 0
      cr = r
      cc = c
      clear = "current"
    } else if (shift) {
      r1 = cs ? cs.r1 : 0
      r2 = cs ? cs.r2 + 1 : 0
      c1 = cs ? cs.c1 : 0
      c2 = cs ? cs.c2 : 0
      cr = r
      cc = c
      clear = "current"
    } else if (accel) {
      r1 = Infinity
      r2 = Infinity
      c1 = c
      c2 = c
      cr = r1
      cc = c1
      clear = "all"
    } else {
      r1 = r + 1
      r2 = r + 1
      c1 = c
      c2 = c
      cr = r1
      cc = c1
      clear = "all"
    }
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear })
    cs = model.currentSelection()
    if (!cs) {
      return
    }
    if (shift || mode === "row") {
      grid.scrollToRow(cs.r2)
    } else {
      grid.scrollToCursor()
    }
  }
  protected onPageUp(grid: DataGrid, event: KeyboardEvent): void {
    if (Platform.accelKey(event)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const model = grid.selectionModel
    if (!model || model.selectionMode === "column") {
      grid.scrollByPage("up")
      return
    }
    const n = Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight)
    const r = model.cursorRow
    const c = model.cursorColumn
    let cs = model.currentSelection()
    let r1: number
    let r2: number
    let c1: number
    let c2: number
    let cr: number
    let cc: number
    let clear: SelectionModel.ClearMode
    if (event.shiftKey) {
      r1 = cs ? cs.r1 : 0
      r2 = cs ? cs.r2 - n : 0
      c1 = cs ? cs.c1 : 0
      c2 = cs ? cs.c2 : 0
      cr = r
      cc = c
      clear = "current"
    } else {
      r1 = cs ? cs.r1 - n : 0
      r2 = r1
      c1 = c
      c2 = c
      cr = r1
      cc = c
      clear = "all"
    }
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear })
    cs = model.currentSelection()
    if (!cs) {
      return
    }
    grid.scrollToRow(cs.r2)
  }
  protected onPageDown(grid: DataGrid, event: KeyboardEvent): void {
    if (Platform.accelKey(event)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    const model = grid.selectionModel
    if (!model || model.selectionMode === "column") {
      grid.scrollByPage("down")
      return
    }
    const n = Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight)
    const r = model.cursorRow
    const c = model.cursorColumn
    let cs = model.currentSelection()
    let r1: number
    let r2: number
    let c1: number
    let c2: number
    let cr: number
    let cc: number
    let clear: SelectionModel.ClearMode
    if (event.shiftKey) {
      r1 = cs ? cs.r1 : 0
      r2 = cs ? cs.r2 + n : 0
      c1 = cs ? cs.c1 : 0
      c2 = cs ? cs.c2 : 0
      cr = r
      cc = c
      clear = "current"
    } else {
      r1 = cs ? cs.r1 + n : 0
      r2 = r1
      c1 = c
      c2 = c
      cr = r1
      cc = c
      clear = "all"
    }
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear })
    cs = model.currentSelection()
    if (!cs) {
      return
    }
    grid.scrollToRow(cs.r2)
  }
  protected onEscape(grid: DataGrid, event: KeyboardEvent): void {
    if (grid.selectionModel) {
      grid.selectionModel.clear()
    }
  }
  protected onDelete(grid: DataGrid, event: KeyboardEvent): void {
    if (grid.editable && !grid.selectionModel!.isEmpty) {
      const dataModel = grid.dataModel as MutableDataModel
      const maxRow = dataModel.rowCount("body") - 1
      const maxColumn = dataModel.columnCount("body") - 1
      for (const s of grid.selectionModel!.selections()) {
        const sr1 = Math.max(0, Math.min(s.r1, maxRow))
        const sc1 = Math.max(0, Math.min(s.c1, maxColumn))
        const sr2 = Math.max(0, Math.min(s.r2, maxRow))
        const sc2 = Math.max(0, Math.min(s.c2, maxColumn))
        for (let r = sr1; r <= sr2; ++r) {
          for (let c = sc1; c <= sc2; ++c) {
            dataModel.setData("body", r, c, null)
          }
        }
      }
    }
  }
  protected onKeyC(grid: DataGrid, event: KeyboardEvent): void {
    if (event.shiftKey || !Platform.accelKey(event)) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    grid.copyToClipboard()
  }
  private _disposed = false
}
export class BasicMouseHandler implements DataGrid.IMouseHandler {
  dispose(): void {
    if (this._disposed) {
      return
    }
    this.release()
    this._disposed = true
  }
  get isDisposed(): boolean {
    return this._disposed
  }
  release(): void {
    if (!this._pressData) {
      return
    }
    if (this._pressData.type === "select") {
      this._pressData.timeout = -1
    }
    this._pressData.override.dispose()
    this._pressData = null
  }
  onMouseHover(grid: DataGrid, event: MouseEvent): void {
    const hit = grid.hitTest(event.clientX, event.clientY)
    const handle = Private.resizeHandleForHitTest(hit)
    let cursor = this.cursorForHandle(handle)
    const config = Private.createCellConfigObject(grid, hit)
    if (config) {
      const renderer = grid.cellRenderers.get(config)
      if (renderer instanceof HyperlinkRenderer) {
        cursor = this.cursorForHandle("hyperlink")
      }
    }
    grid.viewport.node.style.cursor = cursor
  }
  onMouseLeave(grid: DataGrid, event: MouseEvent): void {
    grid.viewport.node.style.cursor = ""
  }
  onMouseDown(grid: DataGrid, event: MouseEvent): void {
    const { clientX, clientY } = event
    const hit = grid.hitTest(clientX, clientY)
    const { region, row, column } = hit
    if (region === "void") {
      return
    }
    const shift = event.shiftKey
    const accel = Platform.accelKey(event)
    if (grid) {
      const config = Private.createCellConfigObject(grid, hit)
      const renderer = grid.cellRenderers.get(config!)
      if (renderer instanceof HyperlinkRenderer) {
        let url = CellRenderer.resolveOption(renderer.url, config!)
        if (!url) {
          const format = TextRenderer.formatGeneric()
          url = format(config!)
        }
        if (accel) {
          window.open(url)
          const cursor = this.cursorForHandle("none")
          grid.viewport.node.style.cursor = cursor
          return
        }
      }
    }
    if (region === "body") {
      const model = grid.selectionModel
      if (!model) {
        return
      }
      const override = Drag.overrideCursor("default")
      this._pressData = {
        type: "select",
        region,
        row,
        column,
        override,
        localX: -1,
        localY: -1,
        timeout: -1,
      }
      let r1: number
      let c1: number
      let r2: number
      let c2: number
      let cursorRow: number
      let cursorColumn: number
      let clear: SelectionModel.ClearMode
      if (accel) {
        r1 = row
        r2 = row
        c1 = column
        c2 = column
        cursorRow = row
        cursorColumn = column
        clear = "none"
      } else if (shift) {
        r1 = model.cursorRow
        r2 = row
        c1 = model.cursorColumn
        c2 = column
        cursorRow = model.cursorRow
        cursorColumn = model.cursorColumn
        clear = "current"
      } else {
        r1 = row
        r2 = row
        c1 = column
        c2 = column
        cursorRow = row
        cursorColumn = column
        clear = "all"
      }
      model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear })
      return
    }
    const cursor = this.cursorForHandle(handle)
    if (handle === "left" || handle === "right") {
      const type = "column-resize"
      const rgn: DataModel.ColumnRegion =
        region === "column-header" ? "body" : "row-header"
      const index = handle === "left" ? column - 1 : column
      const size = grid.columnSize(rgn, index)
      const override = Drag.overrideCursor(cursor)
      this._pressData = { type, region: rgn, index, size, clientX, override }
      return
    }
    if (handle === "top" || handle === "bottom") {
      const type = "row-resize"
      const rgn: DataModel.RowRegion =
        region === "row-header" ? "body" : "column-header"
      const index = handle === "top" ? row - 1 : row
      const size = grid.rowSize(rgn, index)
      const override = Drag.overrideCursor(cursor)
      this._pressData = { type, region: rgn, index, size, clientY, override }
      return
    }
    if (!model) {
      return
    }
    const override = Drag.overrideCursor("default")
    this._pressData = {
      type: "select",
      region,
      row,
      column,
      override,
      localX: -1,
      localY: -1,
      timeout: -1,
    }
    let r1: number
    let c1: number
    let r2: number
    let c2: number
    let cursorRow: number
    let cursorColumn: number
    let clear: SelectionModel.ClearMode
    if (region === "corner-header") {
      r1 = 0
      r2 = Infinity
      c1 = 0
      c2 = Infinity
      cursorRow = accel ? 0 : shift ? model.cursorRow : 0
      cursorColumn = accel ? 0 : shift ? model.cursorColumn : 0
      clear = accel ? "none" : shift ? "current" : "all"
    } else if (region === "row-header") {
      r1 = accel ? row : shift ? model.cursorRow : row
      r2 = row
      const selectionGroup: CellGroup = { r1: r1, c1: 0, r2: r2, c2: 0 }
      const joinedGroup = CellGroup.joinCellGroupsIntersectingAtAxis(
        grid.dataModel!,
        ["row-header", "body"],
        "row",
        selectionGroup
      )
      if (joinedGroup.r1 != Number.MAX_VALUE) {
        r1 = joinedGroup.r1
        r2 = joinedGroup.r2
      }
      c1 = 0
      c2 = Infinity
      cursorRow = accel ? row : shift ? model.cursorRow : row
      cursorColumn = accel ? 0 : shift ? model.cursorColumn : 0
      clear = accel ? "none" : shift ? "current" : "all"
    } else if (region === "column-header") {
      r1 = 0
      r2 = Infinity
      c1 = accel ? column : shift ? model.cursorColumn : column
      c2 = column
      const selectionGroup: CellGroup = { r1: 0, c1: c1, r2: 0, c2: c2 }
      const joinedGroup = CellGroup.joinCellGroupsIntersectingAtAxis(
        grid.dataModel!,
        ["column-header", "body"],
        "column",
        selectionGroup
      )
      if (joinedGroup.c1 != Number.MAX_VALUE) {
        c1 = joinedGroup.c1
        c2 = joinedGroup.c2
      }
      cursorRow = accel ? 0 : shift ? model.cursorRow : 0
      cursorColumn = accel ? column : shift ? model.cursorColumn : column
      clear = accel ? "none" : shift ? "current" : "all"
    } else {
      r1 = accel ? row : shift ? model.cursorRow : row
      r2 = row
      c1 = accel ? column : shift ? model.cursorColumn : column
      c2 = column
      cursorRow = accel ? row : shift ? model.cursorRow : row
      cursorColumn = accel ? column : shift ? model.cursorColumn : column
      clear = accel ? "none" : shift ? "current" : "all"
    }
    model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear })
  }
  onMouseMove(grid: DataGrid, event: MouseEvent): void {
    const data = this._pressData
    if (!data) {
      return
    }
    if (data.type === "row-resize") {
      const dy = event.clientY - data.clientY
      grid.resizeRow(data.region, data.index, data.size + dy)
      return
    }
    if (data.type === "column-resize") {
      const dx = event.clientX - data.clientX
      grid.resizeColumn(data.region, data.index, data.size + dx)
      return
    }
    if (data.region === "corner-header") {
      return
    }
    const model = grid.selectionModel
    if (!model) {
      return
    }
    const { lx, ly } = grid.mapToLocal(event.clientX, event.clientY)
    data.localX = lx
    data.localY = ly
    const hw = grid.headerWidth
    const hh = grid.headerHeight
    const vpw = grid.viewportWidth
    const vph = grid.viewportHeight
    const sx = grid.scrollX
    const sy = grid.scrollY
    const msx = grid.maxScrollY
    const msy = grid.maxScrollY
    const mode = model.selectionMode
    let timeout = -1
    if (data.region === "row-header" || mode === "row") {
      if (ly < hh && sy > 0) {
        timeout = Private.computeTimeout(hh - ly)
      } else if (ly >= vph && sy < msy) {
        timeout = Private.computeTimeout(ly - vph)
      }
    } else if (data.region === "column-header" || mode === "column") {
      if (lx < hw && sx > 0) {
        timeout = Private.computeTimeout(hw - lx)
      } else if (lx >= vpw && sx < msx) {
        timeout = Private.computeTimeout(lx - vpw)
      }
    } else {
      if (lx < hw && sx > 0) {
        timeout = Private.computeTimeout(hw - lx)
      } else if (lx >= vpw && sx < msx) {
        timeout = Private.computeTimeout(lx - vpw)
      } else if (ly < hh && sy > 0) {
        timeout = Private.computeTimeout(hh - ly)
      } else if (ly >= vph && sy < msy) {
        timeout = Private.computeTimeout(ly - vph)
      }
    }
    if (timeout >= 0) {
      if (data.timeout < 0) {
        data.timeout = timeout
        setTimeout(() => {
          Private.autoselect(grid, data)
        }, timeout)
      } else {
        data.timeout = timeout
      }
      return
    }
    data.timeout = -1
    let { vx, vy } = grid.mapToVirtual(event.clientX, event.clientY)
    vx = Math.max(0, Math.min(vx, grid.bodyWidth - 1))
    vy = Math.max(0, Math.min(vy, grid.bodyHeight - 1))
    let r1: number
    let c1: number
    let r2: number
    let c2: number
    const cursorRow = model.cursorRow
    const cursorColumn = model.cursorColumn
    const clear: SelectionModel.ClearMode = "current"
    if (data.region === "row-header" || mode === "row") {
      r1 = data.row
      r2 = grid.rowAt("body", vy)
      const selectionGroup: CellGroup = { r1: r1, c1: 0, r2: r2, c2: 0 }
      const joinedGroup = CellGroup.joinCellGroupsIntersectingAtAxis(
        grid.dataModel!,
        ["row-header", "body"],
        "row",
        selectionGroup
      )
      if (joinedGroup.r1 != Number.MAX_VALUE) {
        r1 = Math.min(r1, joinedGroup.r1)
        r2 = Math.max(r2, joinedGroup.r2)
      }
      c1 = 0
      c2 = Infinity
    } else if (data.region === "column-header" || mode === "column") {
      r1 = 0
      r2 = Infinity
      c1 = data.column
      c2 = grid.columnAt("body", vx)
      const selectionGroup: CellGroup = { r1: 0, c1: c1, r2: 0, c2: c2 }
      const joinedGroup = CellGroup.joinCellGroupsIntersectingAtAxis(
        grid.dataModel!,
        ["column-header", "body"],
        "column",
        selectionGroup
      )
      if (joinedGroup.c1 != Number.MAX_VALUE) {
        c1 = joinedGroup.c1
        c2 = joinedGroup.c2
      }
    } else {
      r1 = cursorRow
      r2 = grid.rowAt("body", vy)
      c1 = cursorColumn
      c2 = grid.columnAt("body", vx)
    }
    model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear })
  }
  onMouseUp(grid: DataGrid, event: MouseEvent): void {
    this.release()
  }
  onMouseDoubleClick(grid: DataGrid, event: MouseEvent): void {
    if (!grid.dataModel) {
      this.release()
      return
    }
    const { clientX, clientY } = event
    const hit = grid.hitTest(clientX, clientY)
    const { region, row, column } = hit
    if (region === "void") {
      this.release()
      return
    }
    if (region === "body") {
      if (grid.editable) {
        const cell: CellEditor.CellConfig = {
          grid: grid,
          row: row,
          column: column,
        }
        grid.editorController!.edit(cell)
      }
    }
    this.release()
  }
  onContextMenu(grid: DataGrid, event: MouseEvent): void {}
  onWheel(grid: DataGrid, event: WheelEvent): void {
    if (this._pressData) {
      return
    }
    let dx = event.deltaX
    let dy = event.deltaY
    switch (event.deltaMode) {
      case 0: // DOM_DELTA_PIXEL
        break
      case 1: {
        const ds = grid.defaultSizes
        dx *= ds.columnWidth
        dy *= ds.rowHeight
        break
      }
      case 2: // DOM_DELTA_PAGE
        dx *= grid.pageWidth
        dy *= grid.pageHeight
        break
      default:
        throw "unreachable"
    }
    grid.scrollBy(dx, dy)
  }
  cursorForHandle(handle: ResizeHandle): string {
    return Private.cursorMap[handle]
  }
  get pressData(): PressData.PressData | null {
    return this._pressData
  }
  private _disposed = false
  protected _pressData: PressData.PressData | null = null
}
export type ResizeHandle =
  | "top"
  | "left"
  | "right"
  | "bottom"
  | "none"
  | "hyperlink"
export namespace PressData {
  export type RowResizeData = {
    readonly type: "row-resize"
    readonly region: DataModel.RowRegion
    readonly index: number
    readonly size: number
    readonly clientY: number
    readonly override: IDisposable
  }
  export type ColumnResizeData = {
    readonly type: "column-resize"
    readonly region: DataModel.ColumnRegion
    readonly index: number
    readonly size: number
    readonly clientX: number
    readonly override: IDisposable
  }
  export type SelectData = {
    readonly type: "select"
    readonly region: DataModel.CellRegion
    readonly row: number
    readonly column: number
    readonly override: IDisposable
    localX: number
    localY: number
    timeout: number
  }
  export type PressData = RowResizeData | ColumnResizeData | SelectData
}
namespace Private {
  export function createCellConfigObject(
    grid: DataGrid,
    hit: DataGrid.HitTestResult
  ): CellRenderer.CellConfig | undefined {
    const { region, row, column } = hit
    if (region === "void") {
      return undefined
    }
    const value = grid.dataModel!.data(region, row, column)
    const metadata = grid.dataModel!.metadata(region, row, column)
    const config = {
      ...hit,
      value: value,
      metadata: metadata,
    } as CellRenderer.CellConfig
    return config
  }
  export function resizeHandleForHitTest(
    hit: DataGrid.HitTestResult
  ): ResizeHandle {
    const r = hit.row
    const c = hit.column
    const lw = hit.x
    const lh = hit.y
    const tw = hit.width - hit.x
    const th = hit.height - hit.y
    let result: ResizeHandle
    switch (hit.region) {
      case "corner-header":
        if (c > 0 && lw <= 5) {
          result = "left"
        } else if (tw <= 6) {
          result = "right"
        } else if (r > 0 && lh <= 5) {
          result = "top"
        } else if (th <= 6) {
          result = "bottom"
        } else {
          result = "none"
        }
        break
      case "column-header":
        if (c > 0 && lw <= 5) {
          result = "left"
        } else if (tw <= 6) {
          result = "right"
        } else if (r > 0 && lh <= 5) {
          result = "top"
        } else if (th <= 6) {
          result = "bottom"
        } else {
          result = "none"
        }
        break
      case "row-header":
        if (c > 0 && lw <= 5) {
          result = "left"
        } else if (tw <= 6) {
          result = "right"
        } else if (r > 0 && lh <= 5) {
          result = "top"
        } else if (th <= 6) {
          result = "bottom"
        } else {
          result = "none"
        }
        break
      case "body":
        result = "none"
        break
      case "void":
        result = "none"
        break
      default:
        throw "unreachable"
    }
    return result
  }
  export function autoselect(grid: DataGrid, data: PressData.SelectData): void {
    if (data.timeout < 0) {
      return
    }
    const model = grid.selectionModel
    if (!model) {
      return
    }
    let cs = model.currentSelection()
    if (!cs) {
      return
    }
    const lx = data.localX
    const ly = data.localY
    const r1 = cs.r1
    const c1 = cs.c1
    let r2 = cs.r2
    let c2 = cs.c2
    const cursorRow = model.cursorRow
    const cursorColumn = model.cursorColumn
    const clear: SelectionModel.ClearMode = "current"
    const hw = grid.headerWidth
    const hh = grid.headerHeight
    const vpw = grid.viewportWidth
    const vph = grid.viewportHeight
    const mode = model.selectionMode
    if (data.region === "row-header" || mode === "row") {
      r2 += ly <= hh ? -1 : ly >= vph ? 1 : 0
    } else if (data.region === "column-header" || mode === "column") {
      c2 += lx <= hw ? -1 : lx >= vpw ? 1 : 0
    } else {
      r2 += ly <= hh ? -1 : ly >= vph ? 1 : 0
      c2 += lx <= hw ? -1 : lx >= vpw ? 1 : 0
    }
    model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear })
    cs = model.currentSelection()
    if (!cs) {
      return
    }
    if (data.region === "row-header" || mode === "row") {
      grid.scrollToRow(cs.r2)
    } else if (data.region === "column-header" || mode == "column") {
      grid.scrollToColumn(cs.c2)
    } else if (mode === "cell") {
      grid.scrollToCell(cs.r2, cs.c2)
    }
    setTimeout(() => {
      autoselect(grid, data)
    }, data.timeout)
  }
  export function computeTimeout(delta: number): number {
    return 5 + 120 * (1 - Math.min(128, Math.abs(delta)) / 128)
  }
  export const cursorMap = {
    top: "ns-resize",
    left: "ew-resize",
    right: "ew-resize",
    bottom: "ns-resize",
    hyperlink: "pointer",
    none: "default",
  }
}
export class BasicSelectionModel extends SelectionModel {
  get isEmpty(): boolean {
    return this._selections.length === 0
  }
  get cursorRow(): number {
    return this._cursorRow
  }
  get cursorColumn(): number {
    return this._cursorColumn
  }
  moveCursorWithinSelections(
    direction: SelectionModel.CursorMoveDirection
  ): void {
    if (this.isEmpty || this.cursorRow === -1 || this._cursorColumn === -1) {
      return
    }
    const firstSelection = this._selections[0]
    if (
      this._selections.length === 1 &&
      firstSelection.r1 === firstSelection.r2 &&
      firstSelection.c1 === firstSelection.c2
    ) {
      return
    }
    if (this._cursorRectIndex === -1) {
      this._cursorRectIndex = this._selections.length - 1
    }
    let cursorRect = this._selections[this._cursorRectIndex]
    const dr = direction === "down" ? 1 : direction === "up" ? -1 : 0
    const dc = direction === "right" ? 1 : direction === "left" ? -1 : 0
    let newRow = this._cursorRow + dr
    let newColumn = this._cursorColumn + dc
    const r1 = Math.min(cursorRect.r1, cursorRect.r2)
    const r2 = Math.max(cursorRect.r1, cursorRect.r2)
    const c1 = Math.min(cursorRect.c1, cursorRect.c2)
    const c2 = Math.max(cursorRect.c1, cursorRect.c2)
    const moveToNextRect = () => {
      this._cursorRectIndex =
        (this._cursorRectIndex + 1) % this._selections.length
      cursorRect = this._selections[this._cursorRectIndex]
      newRow = Math.min(cursorRect.r1, cursorRect.r2)
      newColumn = Math.min(cursorRect.c1, cursorRect.c2)
    }
    const moveToPreviousRect = () => {
      this._cursorRectIndex =
        this._cursorRectIndex === 0
          ? this._selections.length - 1
          : this._cursorRectIndex - 1
      cursorRect = this._selections[this._cursorRectIndex]
      newRow = Math.max(cursorRect.r1, cursorRect.r2)
      newColumn = Math.max(cursorRect.c1, cursorRect.c2)
    }
    if (newRow > r2) {
      newRow = r1
      newColumn += 1
      if (newColumn > c2) {
        moveToNextRect()
      }
    } else if (newRow < r1) {
      newRow = r2
      newColumn -= 1
      if (newColumn < c1) {
        moveToPreviousRect()
      }
    } else if (newColumn > c2) {
      newColumn = c1
      newRow += 1
      if (newRow > r2) {
        moveToNextRect()
      }
    } else if (newColumn < c1) {
      newColumn = c2
      newRow -= 1
      if (newRow < r1) {
        moveToPreviousRect()
      }
    }
    this._cursorRow = newRow
    this._cursorColumn = newColumn
    this.emitChanged()
  }
  currentSelection(): SelectionModel.Selection | null {
    return this._selections[this._selections.length - 1] || null
  }
  *selections(): IterableIterator<SelectionModel.Selection> {
    yield* this._selections
  }
  select(args: SelectionModel.SelectArgs): void {
    const rowCount = this.dataModel.rowCount("body")
    const columnCount = this.dataModel.columnCount("body")
    if (rowCount <= 0 || columnCount <= 0) {
      return
    }
    let { r1, c1, r2, c2, cursorRow, cursorColumn, clear } = args
    if (clear === "all") {
      this._selections.length = 0
    } else if (clear === "current") {
      this._selections.pop()
    }
    r1 = Math.max(0, Math.min(r1, rowCount - 1))
    r2 = Math.max(0, Math.min(r2, rowCount - 1))
    c1 = Math.max(0, Math.min(c1, columnCount - 1))
    c2 = Math.max(0, Math.min(c2, columnCount - 1))
    let alreadySelected = false
    if (this.selectionMode === "row") {
      c1 = 0
      c2 = columnCount - 1
      alreadySelected =
        this._selections.filter(selection => selection.r1 === r1).length !== 0
      this._selections = alreadySelected
        ? this._selections.filter(selection => selection.r1 !== r1)
        : this._selections
    } else if (this.selectionMode === "column") {
      r1 = 0
      r2 = rowCount - 1
      alreadySelected =
        this._selections.filter(selection => selection.c1 === c1).length !== 0
      this._selections = alreadySelected
        ? this._selections.filter(selection => selection.c1 !== c1)
        : this._selections
    }
    let cr = cursorRow
    let cc = cursorColumn
    if (cr < 0 || (cr < r1 && cr < r2) || (cr > r1 && cr > r2)) {
      cr = r1
    }
    if (cc < 0 || (cc < c1 && cc < c2) || (cc > c1 && cc > c2)) {
      cc = c1
    }
    this._cursorRow = cr
    this._cursorColumn = cc
    this._cursorRectIndex = this._selections.length
    if (!alreadySelected) {
      this._selections.push({ r1, c1, r2, c2 })
    }
    this.emitChanged()
  }
  clear(): void {
    if (this._selections.length === 0) {
      return
    }
    this._cursorRow = -1
    this._cursorColumn = -1
    this._cursorRectIndex = -1
    this._selections.length = 0
    this.emitChanged()
  }
  protected onDataModelChanged(
    sender: DataModel,
    args: DataModel.ChangedArgs
  ): void {
    if (this._selections.length === 0) {
      return
    }
    if (args.type === "cells-changed") {
      return
    }
    if (args.type === "rows-moved" || args.type === "columns-moved") {
      return
    }
    const lr = sender.rowCount("body") - 1
    const lc = sender.columnCount("body") - 1
    if (lr < 0 || lc < 0) {
      this._selections.length = 0
      this.emitChanged()
      return
    }
    const mode = this.selectionMode
    let j = 0
    for (let i = 0, n = this._selections.length; i < n; ++i) {
      let { r1, c1, r2, c2 } = this._selections[i]
      if ((lr < r1 && lr < r2) || (lc < c1 && lc < c2)) {
        continue
      }
      if (mode === "row") {
        r1 = Math.max(0, Math.min(r1, lr))
        r2 = Math.max(0, Math.min(r2, lr))
        c1 = 0
        c2 = lc
      } else if (mode === "column") {
        r1 = 0
        r2 = lr
        c1 = Math.max(0, Math.min(c1, lc))
        c2 = Math.max(0, Math.min(c2, lc))
      } else {
        r1 = Math.max(0, Math.min(r1, lr))
        r2 = Math.max(0, Math.min(r2, lr))
        c1 = Math.max(0, Math.min(c1, lc))
        c2 = Math.max(0, Math.min(c2, lc))
      }
      this._selections[j++] = { r1, c1, r2, c2 }
    }
    this._selections.length = j
    this.emitChanged()
  }
  private _cursorRow = -1
  private _cursorColumn = -1
  private _cursorRectIndex = -1
  private _selections: SelectionModel.Selection[] = []
}
export interface ICellInputValidatorResponse {
  valid: boolean
  message?: string
}
export interface ICellInputValidator {
  validate(cell: CellEditor.CellConfig, value: any): ICellInputValidatorResponse
}
export interface ICellEditResponse {
  cell: CellEditor.CellConfig
  value: any
  cursorMovement: SelectionModel.CursorMoveDirection
}
export interface ICellEditor {
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): void
  cancel(): void
}
const DEFAULT_INVALID_INPUT_MESSAGE = "Invalid input!"
export type CellDataType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "date"
  | "string:option"
  | "number:option"
  | "integer:option"
  | "date:option"
  | "string:dynamic-option"
  | "number:dynamic-option"
  | "integer:dynamic-option"
  | "date:dynamic-option"
export interface ICellEditOptions {
  editor?: ICellEditor
  validator?: ICellInputValidator
  onCommit?: (response: ICellEditResponse) => void
  onCancel?: () => void
}
export class PassInputValidator implements ICellInputValidator {
  validate(
    cell: CellEditor.CellConfig,
    value: unknown
  ): ICellInputValidatorResponse {
    return { valid: true }
  }
}
export class TextInputValidator implements ICellInputValidator {
  validate(
    cell: CellEditor.CellConfig,
    value: string
  ): ICellInputValidatorResponse {
    if (value === null) {
      return { valid: true }
    }
    if (typeof value !== "string") {
      return {
        valid: false,
        message: "Input must be valid text",
      }
    }
    if (!isNaN(this.minLength) && value.length < this.minLength) {
      return {
        valid: false,
        message: `Text length must be greater than ${this.minLength}`,
      }
    }
    if (!isNaN(this.maxLength) && value.length > this.maxLength) {
      return {
        valid: false,
        message: `Text length must be less than ${this.maxLength}`,
      }
    }
    if (this.pattern && !this.pattern.test(value)) {
      return {
        valid: false,
        message: `Text doesn't match the required pattern`,
      }
    }
    return { valid: true }
  }
  minLength: number = Number.NaN
  maxLength: number = Number.NaN
  pattern: RegExp | null = null
}
export class IntegerInputValidator implements ICellInputValidator {
  validate(
    cell: CellEditor.CellConfig,
    value: number
  ): ICellInputValidatorResponse {
    if (value === null) {
      return { valid: true }
    }
    if (isNaN(value) || value % 1 !== 0) {
      return {
        valid: false,
        message: "Input must be valid integer",
      }
    }
    if (!isNaN(this.min) && value < this.min) {
      return {
        valid: false,
        message: `Input must be greater than ${this.min}`,
      }
    }
    if (!isNaN(this.max) && value > this.max) {
      return {
        valid: false,
        message: `Input must be less than ${this.max}`,
      }
    }
    return { valid: true }
  }
  min: number = Number.NaN
  max: number = Number.NaN
}
export class NumberInputValidator implements ICellInputValidator {
  validate(
    cell: CellEditor.CellConfig,
    value: number
  ): ICellInputValidatorResponse {
    if (value === null) {
      return { valid: true }
    }
    if (isNaN(value)) {
      return {
        valid: false,
        message: "Input must be valid number",
      }
    }
    if (!isNaN(this.min) && value < this.min) {
      return {
        valid: false,
        message: `Input must be greater than ${this.min}`,
      }
    }
    if (!isNaN(this.max) && value > this.max) {
      return {
        valid: false,
        message: `Input must be less than ${this.max}`,
      }
    }
    return { valid: true }
  }
  min: number = Number.NaN
  max: number = Number.NaN
}
export abstract class CellEditor implements ICellEditor, IDisposable {
  constructor() {
    this.inputChanged.connect(() => {
      this.validate()
    })
  }
  get isDisposed(): boolean {
    return this._disposed
  }
  dispose(): void {
    if (this._disposed) {
      return
    }
    if (this._gridWheelEventHandler) {
      this.cell.grid.node.removeEventListener(
        "wheel",
        this._gridWheelEventHandler
      )
      this._gridWheelEventHandler = null
    }
    this._closeValidityNotification()
    this._disposed = true
    this.cell.grid.node.removeChild(this.viewportOccluder)
  }
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): void {
    this.cell = cell
    this.onCommit = options && options.onCommit
    this.onCancel = options && options.onCancel
    this.validator =
      options && options.validator
        ? options.validator
        : this.createValidatorBasedOnType()
    this._gridWheelEventHandler = () => {
      this._closeValidityNotification()
      this.updatePosition()
    }
    cell.grid.node.addEventListener("wheel", this._gridWheelEventHandler)
    this._addContainer()
    this.updatePosition()
    this.startEditing()
  }
  cancel(): void {
    if (this._disposed) {
      return
    }
    this.dispose()
    if (this.onCancel) {
      this.onCancel()
    }
  }
  protected abstract startEditing(): void
  protected abstract getInput(): any
  protected get validInput(): boolean {
    return this._validInput
  }
  protected validate(): void {
    let value
    try {
      value = this.getInput()
    } catch (error) {
      console.log(`Input error: ${error.message}`)
      this.setValidity(false, error.message || DEFAULT_INVALID_INPUT_MESSAGE)
      return
    }
    if (this.validator) {
      const result = this.validator.validate(this.cell, value)
      if (result.valid) {
        this.setValidity(true)
      } else {
        this.setValidity(false, result.message || DEFAULT_INVALID_INPUT_MESSAGE)
      }
    } else {
      this.setValidity(true)
    }
  }
  protected setValidity(valid: boolean, message: string = ""): void {
    this._validInput = valid
    this._closeValidityNotification()
    if (valid) {
      this.editorContainer.classList.remove("lm-mod-invalid")
    } else {
      this.editorContainer.classList.add("lm-mod-invalid")
      if (message !== "") {
        this.validityNotification = new Notification({
          target: this.editorContainer,
          message: message,
          placement: "bottom",
          timeout: 5000,
        })
        this.validityNotification.show()
      }
    }
  }
  protected createValidatorBasedOnType(): ICellInputValidator | undefined {
    const cell = this.cell
    const metadata = cell.grid.dataModel!.metadata(
      "body",
      cell.row,
      cell.column
    )
    switch (metadata && metadata.type) {
      case "string":
        {
          const validator = new TextInputValidator()
          if (typeof metadata!.format === "string") {
            const format = metadata!.format
            switch (format) {
              case "email":
                validator.pattern = new RegExp(
                  "^([a-z0-9_.-]+)@([da-z.-]+).([a-z.]{2,6})$"
                )
                break
              case "uuid":
                validator.pattern = new RegExp(
                  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                )
                break
              case "uri":
                break
              case "binary":
                break
            }
          }
          if (metadata!.constraint) {
            if (metadata!.constraint.minLength !== undefined) {
              validator.minLength = metadata!.constraint.minLength
            }
            if (metadata!.constraint.maxLength !== undefined) {
              validator.maxLength = metadata!.constraint.maxLength
            }
            if (typeof metadata!.constraint.pattern === "string") {
              validator.pattern = new RegExp(metadata!.constraint.pattern)
            }
          }
          return validator
        }
        break
      case "number":
        {
          const validator = new NumberInputValidator()
          if (metadata!.constraint) {
            if (metadata!.constraint.minimum !== undefined) {
              validator.min = metadata!.constraint.minimum
            }
            if (metadata!.constraint.maximum !== undefined) {
              validator.max = metadata!.constraint.maximum
            }
          }
          return validator
        }
        break
      case "integer":
        {
          const validator = new IntegerInputValidator()
          if (metadata!.constraint) {
            if (metadata!.constraint.minimum !== undefined) {
              validator.min = metadata!.constraint.minimum
            }
            if (metadata!.constraint.maximum !== undefined) {
              validator.max = metadata!.constraint.maximum
            }
          }
          return validator
        }
        break
    }
    return undefined
  }
  protected getCellInfo(cell: CellEditor.CellConfig): Private.ICellInfo {
    const { grid, row, column } = cell
    let data, columnX, rowY, width, height
    const cellGroup = CellGroup.getGroup(grid.dataModel!, "body", row, column)
    if (cellGroup) {
      columnX =
        grid.headerWidth -
        grid.scrollX +
        grid.columnOffset("body", cellGroup.c1)
      rowY =
        grid.headerHeight - grid.scrollY + grid.rowOffset("body", cellGroup.r1)
      width = 0
      height = 0
      for (let r = cellGroup.r1; r <= cellGroup.r2; r++) {
        height += grid.rowSize("body", r)
      }
      for (let c = cellGroup.c1; c <= cellGroup.c2; c++) {
        width += grid.columnSize("body", c)
      }
      data = grid.dataModel!.data("body", cellGroup.r1, cellGroup.c1)
    } else {
      columnX =
        grid.headerWidth - grid.scrollX + grid.columnOffset("body", column)
      rowY = grid.headerHeight - grid.scrollY + grid.rowOffset("body", row)
      width = grid.columnSize("body", column)
      height = grid.rowSize("body", row)
      data = grid.dataModel!.data("body", row, column)
    }
    return {
      grid: grid,
      row: row,
      column: column,
      data: data,
      x: columnX,
      y: rowY,
      width: width,
      height: height,
    }
  }
  protected updatePosition(): void {
    const grid = this.cell.grid
    const cellInfo = this.getCellInfo(this.cell)
    const headerHeight = grid.headerHeight
    const headerWidth = grid.headerWidth
    this.viewportOccluder.style.top = headerHeight + "px"
    this.viewportOccluder.style.left = headerWidth + "px"
    this.viewportOccluder.style.width = grid.viewportWidth - headerWidth + "px"
    this.viewportOccluder.style.height =
      grid.viewportHeight - headerHeight + "px"
    this.viewportOccluder.style.position = "absolute"
    this.editorContainer.style.left = cellInfo.x - 1 - headerWidth + "px"
    this.editorContainer.style.top = cellInfo.y - 1 - headerHeight + "px"
    this.editorContainer.style.width = cellInfo.width + 1 + "px"
    this.editorContainer.style.height = cellInfo.height + 1 + "px"
    this.editorContainer.style.visibility = "visible"
    this.editorContainer.style.position = "absolute"
  }
  protected commit(
    cursorMovement: SelectionModel.CursorMoveDirection = "none"
  ): boolean {
    this.validate()
    if (!this._validInput) {
      return false
    }
    let value
    try {
      value = this.getInput()
    } catch (error) {
      console.log(`Input error: ${error.message}`)
      return false
    }
    this.dispose()
    if (this.onCommit) {
      this.onCommit({
        cell: this.cell,
        value: value,
        cursorMovement: cursorMovement,
      })
    }
    return true
  }
  private _addContainer() {
    this.viewportOccluder = document.createElement("div")
    this.viewportOccluder.className = "lm-DataGrid-cellEditorOccluder"
    this.cell.grid.node.appendChild(this.viewportOccluder)
    this.editorContainer = document.createElement("div")
    this.editorContainer.className = "lm-DataGrid-cellEditorContainer"
    this.viewportOccluder.appendChild(this.editorContainer)
    this.editorContainer.addEventListener("mouseleave", (event: MouseEvent) => {
      this.viewportOccluder.style.pointerEvents = this._validInput
        ? "none"
        : "auto"
    })
    this.editorContainer.addEventListener("mouseenter", (event: MouseEvent) => {
      this.viewportOccluder.style.pointerEvents = "none"
    })
  }
  private _closeValidityNotification() {
    if (this.validityNotification) {
      this.validityNotification.close()
      this.validityNotification = null
    }
  }
  protected inputChanged = new Signal<this, void>(this)
  protected onCommit?: (response: ICellEditResponse) => void
  protected onCancel?: () => void
  protected cell: CellEditor.CellConfig
  protected validator: ICellInputValidator | undefined
  protected viewportOccluder: HTMLDivElement
  protected editorContainer: HTMLDivElement
  protected validityNotification: Notification | null = null
  private _disposed = false
  private _validInput: boolean = true
  private _gridWheelEventHandler:
    | ((this: HTMLElement, ev: WheelEvent) => any)
    | null = null
}
export abstract class InputCellEditor extends CellEditor {
  handleEvent(event: Event): void {
    switch (event.type) {
      case "keydown":
        this._onKeyDown(event as KeyboardEvent)
        break
      case "blur":
        this._onBlur(event as FocusEvent)
        break
      case "input":
        this._onInput(event)
        break
    }
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    this._unbindEvents()
    super.dispose()
  }
  protected startEditing(): void {
    this.createWidget()
    const cell = this.cell
    const cellInfo = this.getCellInfo(cell)
    this.input.value = this.deserialize(cellInfo.data)
    this.editorContainer.appendChild(this.input)
    this.input.focus()
    this.input.select()
    this.bindEvents()
  }
  protected deserialize(value: unknown): any {
    if (value === null || value === undefined) {
      return ""
    }
    return (value as any).toString()
  }
  protected createWidget(): void {
    const input = document.createElement("input")
    input.classList.add("lm-DataGrid-cellEditorWidget")
    input.classList.add("lm-DataGrid-cellEditorInput")
    input.spellcheck = false
    input.type = this.inputType
    this.input = input
  }
  protected bindEvents(): void {
    this.input.addEventListener("keydown", this)
    this.input.addEventListener("blur", this)
    this.input.addEventListener("input", this)
  }
  private _unbindEvents() {
    this.input.removeEventListener("keydown", this)
    this.input.removeEventListener("blur", this)
    this.input.removeEventListener("input", this)
  }
  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case "Enter":
        this.commit(event.shiftKey ? "up" : "down")
        break
      case "Tab":
        this.commit(event.shiftKey ? "left" : "right")
        event.stopPropagation()
        event.preventDefault()
        break
      case "Escape":
        this.cancel()
        break
      default:
        break
    }
  }
  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return
    }
    if (!this.commit()) {
      event.preventDefault()
      event.stopPropagation()
      this.input.focus()
    }
  }
  private _onInput(event: Event) {
    this.inputChanged.emit(void 0)
  }
  protected input: HTMLInputElement
  protected abstract inputType: string
}
export class TextCellEditor extends InputCellEditor {
  protected getInput(): string | null {
    return this.input.value
  }
  protected inputType: string = "text"
}
export class NumberCellEditor extends InputCellEditor {
  protected startEditing(): void {
    super.startEditing()
    this.input.step = "any"
    const cell = this.cell
    const metadata = cell.grid.dataModel!.metadata(
      "body",
      cell.row,
      cell.column
    )
    const constraint = metadata.constraint
    if (constraint) {
      if (constraint.minimum) {
        this.input.min = constraint.minimum
      }
      if (constraint.maximum) {
        this.input.max = constraint.maximum
      }
    }
  }
  protected getInput(): number | null {
    const value = this.input.value
    if (value.trim() === "") {
      return null
    }
    const floatValue = parseFloat(value)
    if (isNaN(floatValue)) {
      throw new Error("Invalid input")
    }
    return floatValue
  }
  protected inputType: string = "number"
}
export class IntegerCellEditor extends InputCellEditor {
  protected startEditing(): void {
    super.startEditing()
    this.input.step = "1"
    const cell = this.cell
    const metadata = cell.grid.dataModel!.metadata(
      "body",
      cell.row,
      cell.column
    )
    const constraint = metadata.constraint
    if (constraint) {
      if (constraint.minimum) {
        this.input.min = constraint.minimum
      }
      if (constraint.maximum) {
        this.input.max = constraint.maximum
      }
    }
  }
  protected getInput(): number | null {
    const value = this.input.value
    if (value.trim() === "") {
      return null
    }
    const intValue = parseInt(value)
    if (isNaN(intValue)) {
      throw new Error("Invalid input")
    }
    return intValue
  }
  protected inputType: string = "number"
}
export class DateCellEditor extends CellEditor {
  handleEvent(event: Event): void {
    switch (event.type) {
      case "keydown":
        this._onKeyDown(event as KeyboardEvent)
        break
      case "blur":
        this._onBlur(event as FocusEvent)
        break
    }
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    this._unbindEvents()
    super.dispose()
  }
  protected startEditing(): void {
    this._createWidget()
    const cell = this.cell
    const cellInfo = this.getCellInfo(cell)
    this._input.value = this._deserialize(cellInfo.data)
    this.editorContainer.appendChild(this._input)
    this._input.focus()
    this._bindEvents()
  }
  protected getInput(): string | null {
    return this._input.value
  }
  private _deserialize(value: any): any {
    if (value === null || value === undefined) {
      return ""
    }
    return value.toString()
  }
  private _createWidget() {
    const input = document.createElement("input")
    input.type = "date"
    input.pattern = "d{4}-d{2}-d{2}"
    input.classList.add("lm-DataGrid-cellEditorWidget")
    input.classList.add("lm-DataGrid-cellEditorInput")
    this._input = input
  }
  private _bindEvents() {
    this._input.addEventListener("keydown", this)
    this._input.addEventListener("blur", this)
  }
  private _unbindEvents() {
    this._input.removeEventListener("keydown", this)
    this._input.removeEventListener("blur", this)
  }
  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case "Enter":
        this.commit(event.shiftKey ? "up" : "down")
        break
      case "Tab":
        this.commit(event.shiftKey ? "left" : "right")
        event.stopPropagation()
        event.preventDefault()
        break
      case "Escape":
        this.cancel()
        break
      default:
        break
    }
  }
  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return
    }
    if (!this.commit()) {
      event.preventDefault()
      event.stopPropagation()
      this._input.focus()
    }
  }
  private _input: HTMLInputElement
}
export class BooleanCellEditor extends CellEditor {
  handleEvent(event: Event): void {
    switch (event.type) {
      case "keydown":
        this._onKeyDown(event as KeyboardEvent)
        break
      case "mousedown":
        this._input.focus()
        event.stopPropagation()
        event.preventDefault()
        break
      case "blur":
        this._onBlur(event as FocusEvent)
        break
    }
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    this._unbindEvents()
    super.dispose()
  }
  protected startEditing(): void {
    this._createWidget()
    const cell = this.cell
    const cellInfo = this.getCellInfo(cell)
    this._input.checked = this._deserialize(cellInfo.data)
    this.editorContainer.appendChild(this._input)
    this._input.focus()
    this._bindEvents()
  }
  protected getInput(): boolean | null {
    return this._input.checked
  }
  private _deserialize(value: any): any {
    if (value === null || value === undefined) {
      return false
    }
    return value == true
  }
  private _createWidget() {
    const input = document.createElement("input")
    input.classList.add("lm-DataGrid-cellEditorWidget")
    input.classList.add("lm-DataGrid-cellEditorCheckbox")
    input.type = "checkbox"
    input.spellcheck = false
    this._input = input
  }
  private _bindEvents() {
    this._input.addEventListener("keydown", this)
    this._input.addEventListener("mousedown", this)
    this._input.addEventListener("blur", this)
  }
  private _unbindEvents() {
    this._input.removeEventListener("keydown", this)
    this._input.removeEventListener("mousedown", this)
    this._input.removeEventListener("blur", this)
  }
  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case "Enter":
        this.commit(event.shiftKey ? "up" : "down")
        break
      case "Tab":
        this.commit(event.shiftKey ? "left" : "right")
        event.stopPropagation()
        event.preventDefault()
        break
      case "Escape":
        this.cancel()
        break
      default:
        break
    }
  }
  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return
    }
    if (!this.commit()) {
      event.preventDefault()
      event.stopPropagation()
      this._input.focus()
    }
  }
  private _input: HTMLInputElement
}
export class OptionCellEditor extends CellEditor {
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    super.dispose()
    if (this._isMultiSelect) {
      document.body.removeChild(this._select)
    }
  }
  protected startEditing(): void {
    const cell = this.cell
    const cellInfo = this.getCellInfo(cell)
    const metadata = cell.grid.dataModel!.metadata(
      "body",
      cell.row,
      cell.column
    )
    this._isMultiSelect = metadata.type === "array"
    this._createWidget()
    if (this._isMultiSelect) {
      this._select.multiple = true
      const values = this._deserialize(cellInfo.data) as string[]
      for (let i = 0; i < this._select.options.length; ++i) {
        const option = this._select.options.item(i)
        option!.selected = values.indexOf(option!.value) !== -1
      }
      document.body.appendChild(this._select)
    } else {
      this._select.value = this._deserialize(cellInfo.data) as string
      this.editorContainer.appendChild(this._select)
    }
    this._select.focus()
    this._bindEvents()
    this.updatePosition()
  }
  protected getInput(): string | string[] | null {
    if (this._isMultiSelect) {
      const input: string[] = []
      for (let i = 0; i < this._select.selectedOptions.length; ++i) {
        input.push(this._select.selectedOptions.item(i)!.value)
      }
      return input
    } else {
      return this._select.value
    }
  }
  protected updatePosition(): void {
    super.updatePosition()
    if (!this._isMultiSelect) {
      return
    }
    const cellInfo = this.getCellInfo(this.cell)
    this._select.style.position = "absolute"
    const editorContainerRect = this.editorContainer.getBoundingClientRect()
    this._select.style.left = editorContainerRect.left + "px"
    this._select.style.top = editorContainerRect.top + cellInfo.height + "px"
    this._select.style.width = editorContainerRect.width + "px"
    this._select.style.maxHeight = "60px"
    this.editorContainer.style.visibility = "hidden"
  }
  private _deserialize(value: any): string | string[] {
    if (value === null || value === undefined) {
      return ""
    }
    if (this._isMultiSelect) {
      const values: string[] = []
      if (Array.isArray(value)) {
        for (const item of value) {
          values.push(item.toString())
        }
      }
      return values
    } else {
      return value.toString()
    }
  }
  private _createWidget() {
    const cell = this.cell
    const metadata = cell.grid.dataModel!.metadata(
      "body",
      cell.row,
      cell.column
    )
    const items = metadata.constraint.enum
    const select = document.createElement("select")
    select.classList.add("lm-DataGrid-cellEditorWidget")
    for (const item of items) {
      const option = document.createElement("option")
      option.value = item
      option.text = item
      select.appendChild(option)
    }
    this._select = select
  }
  private _bindEvents() {
    this._select.addEventListener("keydown", this._onKeyDown.bind(this))
    this._select.addEventListener("blur", this._onBlur.bind(this))
  }
  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case "Enter":
        this.commit(event.shiftKey ? "up" : "down")
        break
      case "Tab":
        this.commit(event.shiftKey ? "left" : "right")
        event.stopPropagation()
        event.preventDefault()
        break
      case "Escape":
        this.cancel()
        break
      default:
        break
    }
  }
  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return
    }
    if (!this.commit()) {
      event.preventDefault()
      event.stopPropagation()
      this._select.focus()
    }
  }
  private _select: HTMLSelectElement
  private _isMultiSelect: boolean = false
}
export class DynamicOptionCellEditor extends CellEditor {
  handleEvent(event: Event): void {
    switch (event.type) {
      case "keydown":
        this._onKeyDown(event as KeyboardEvent)
        break
      case "blur":
        this._onBlur(event as FocusEvent)
        break
    }
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    this._unbindEvents()
    super.dispose()
  }
  protected startEditing(): void {
    this._createWidget()
    const cell = this.cell
    const cellInfo = this.getCellInfo(cell)
    this._input.value = this._deserialize(cellInfo.data)
    this.editorContainer.appendChild(this._input)
    this._input.focus()
    this._input.select()
    this._bindEvents()
  }
  protected getInput(): string | null {
    return this._input.value
  }
  private _deserialize(value: any): any {
    if (value === null || value === undefined) {
      return ""
    }
    return value.toString()
  }
  private _createWidget() {
    const cell = this.cell
    const grid = cell.grid
    const dataModel = grid.dataModel!
    const rowCount = dataModel.rowCount("body")
    const listId = "cell-editor-list"
    const list = document.createElement("datalist")
    list.id = listId
    const input = document.createElement("input")
    input.classList.add("lm-DataGrid-cellEditorWidget")
    input.classList.add("lm-DataGrid-cellEditorInput")
    const valueSet = new Set<string>()
    for (let r = 0; r < rowCount; ++r) {
      const data = dataModel.data("body", r, cell.column)
      if (data) {
        valueSet.add(data)
      }
    }
    valueSet.forEach((value: string) => {
      const option = document.createElement("option")
      option.value = value
      option.text = value
      list.appendChild(option)
    })
    this.editorContainer.appendChild(list)
    input.setAttribute("list", listId)
    this._input = input
  }
  private _bindEvents() {
    this._input.addEventListener("keydown", this)
    this._input.addEventListener("blur", this)
  }
  private _unbindEvents() {
    this._input.removeEventListener("keydown", this)
    this._input.removeEventListener("blur", this)
  }
  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case "Enter":
        this.commit(event.shiftKey ? "up" : "down")
        break
      case "Tab":
        this.commit(event.shiftKey ? "left" : "right")
        event.stopPropagation()
        event.preventDefault()
        break
      case "Escape":
        this.cancel()
        break
      default:
        break
    }
  }
  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return
    }
    if (!this.commit()) {
      event.preventDefault()
      event.stopPropagation()
      this._input.focus()
    }
  }
  private _input: HTMLInputElement
}
export namespace CellEditor {
  export type CellConfig = {
    readonly grid: DataGrid
    readonly row: number
    readonly column: number
  }
}
namespace Private {
  export type ICellInfo = {
    grid: DataGrid
    row: number
    column: number
    data: any
    x: number
    y: number
    width: number
    height: number
  }
}
export type EditorOverrideIdentifier =
  | CellDataType
  | DataModel.Metadata
  | "default"
export interface ICellEditorController {
  setEditor(
    identifier: EditorOverrideIdentifier,
    editor: ICellEditor | Resolver
  ): void
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): boolean
  cancel(): void
}
export type ConfigFunc<T> = (config: CellEditor.CellConfig) => T
export type ConfigOption<T> = T | ConfigFunc<T>
export type Resolver = ConfigFunc<ICellEditor | undefined>
export function resolveOption<T>(
  option: ConfigOption<T>,
  config: CellEditor.CellConfig
): T {
  return typeof option === "function"
    ? (option as ConfigFunc<T>)(config)
    : option
}
export class CellEditorController implements ICellEditorController {
  setEditor(
    identifier: EditorOverrideIdentifier,
    editor: ICellEditor | Resolver
  ): void {
    if (typeof identifier === "string") {
      this._typeBasedOverrides.set(identifier, editor)
    } else {
      const key = this._metadataIdentifierToKey(identifier)
      this._metadataBasedOverrides.set(key, [identifier, editor])
    }
  }
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): boolean {
    const grid = cell.grid
    if (!grid.editable) {
      console.error("Grid cannot be edited!")
      return false
    }
    this.cancel()
    this._cell = cell
    options = options || {}
    options.onCommit = options.onCommit || this._onCommit.bind(this)
    options.onCancel = options.onCancel || this._onCancel.bind(this)
    if (options.editor) {
      this._editor = options.editor
      options.editor.edit(cell, options)
      return true
    }
    const editor = this._getEditor(cell)
    if (editor) {
      this._editor = editor
      editor.edit(cell, options)
      return true
    }
    return false
  }
  cancel(): void {
    if (this._editor) {
      this._editor.cancel()
      this._editor = null
    }
    this._cell = null
  }
  private _onCommit(response: ICellEditResponse): void {
    const cell = this._cell
    if (!cell) {
      return
    }
    const grid = cell.grid
    const dataModel = grid.dataModel as MutableDataModel
    let row = cell.row
    let column = cell.column
    const cellGroup = CellGroup.getGroup(grid.dataModel!, "body", row, column)
    if (cellGroup) {
      row = cellGroup.r1
      column = cellGroup.c1
    }
    dataModel.setData("body", row, column, response.value)
    grid.viewport.node.focus()
    if (response.cursorMovement !== "none") {
      grid.moveCursor(response.cursorMovement)
      grid.scrollToCursor()
    }
  }
  private _onCancel(): void {
    if (!this._cell) {
      return
    }
    this._cell.grid.viewport.node.focus()
  }
  private _getDataTypeKey(cell: CellEditor.CellConfig): string {
    const metadata = cell.grid.dataModel
      ? cell.grid.dataModel.metadata("body", cell.row, cell.column)
      : null
    if (!metadata) {
      return "default"
    }
    let key = ""
    if (metadata) {
      key = metadata.type
    }
    if (metadata.constraint && metadata.constraint.enum) {
      if (metadata.constraint.enum === "dynamic") {
        key += ":dynamic-option"
      } else {
        key += ":option"
      }
    }
    return key
  }
  private _objectToKey(object: any): string {
    let str = ""
    for (const key in object) {
      const value = object[key]
      if (typeof value === "object") {
        str += `${key}:${this._objectToKey(value)}`
      } else {
        str += `[${key}:${value}]`
      }
    }
    return str
  }
  private _metadataIdentifierToKey(metadata: DataModel.Metadata): string {
    return this._objectToKey(metadata)
  }
  private _metadataMatchesIdentifier(
    metadata: DataModel.Metadata,
    identifier: DataModel.Metadata
  ): boolean {
    for (const key in identifier) {
      if (!metadata.hasOwnProperty(key)) {
        return false
      }
      const identifierValue = identifier[key]
      const metadataValue = metadata[key]
      if (typeof identifierValue === "object") {
        if (!this._metadataMatchesIdentifier(metadataValue, identifierValue)) {
          return false
        }
      } else if (metadataValue !== identifierValue) {
        return false
      }
    }
    return true
  }
  private _getMetadataBasedEditor(
    cell: CellEditor.CellConfig
  ): ICellEditor | undefined {
    let editorMatched: ICellEditor | undefined
    const metadata = cell.grid.dataModel!.metadata(
      "body",
      cell.row,
      cell.column
    )
    if (metadata) {
      this._metadataBasedOverrides.forEach(value => {
        if (!editorMatched) {
          const [identifier, editor] = value
          if (this._metadataMatchesIdentifier(metadata, identifier)) {
            editorMatched = resolveOption(editor, cell)
          }
        }
      })
    }
    return editorMatched
  }
  private _getEditor(cell: CellEditor.CellConfig): ICellEditor | undefined {
    const dtKey = this._getDataTypeKey(cell)
    if (this._typeBasedOverrides.has(dtKey)) {
      const editor = this._typeBasedOverrides.get(dtKey)
      return resolveOption(editor!, cell)
    } else if (this._metadataBasedOverrides.size > 0) {
      const editor = this._getMetadataBasedEditor(cell)
      if (editor) {
        return editor
      }
    }
    switch (dtKey) {
      case "string":
        return new TextCellEditor()
      case "number":
        return new NumberCellEditor()
      case "integer":
        return new IntegerCellEditor()
      case "boolean":
        return new BooleanCellEditor()
      case "date":
        return new DateCellEditor()
      case "string:option":
      case "number:option":
      case "integer:option":
      case "date:option":
      case "array:option":
        return new OptionCellEditor()
      case "string:dynamic-option":
      case "number:dynamic-option":
      case "integer:dynamic-option":
      case "date:dynamic-option":
        return new DynamicOptionCellEditor()
    }
    if (this._typeBasedOverrides.has("default")) {
      const editor = this._typeBasedOverrides.get("default")
      return resolveOption(editor!, cell)
    }
    const data = cell.grid.dataModel!.data("body", cell.row, cell.column)
    if (!data || typeof data !== "object") {
      return new TextCellEditor()
    }
    return undefined
  }
  private _editor: ICellEditor | null = null
  private _cell: CellEditor.CellConfig | null = null
  private _typeBasedOverrides: Map<string, ICellEditor | Resolver> = new Map()
  private _metadataBasedOverrides: Map<
    string,
    [DataModel.Metadata, ICellEditor | Resolver]
  > = new Map()
}
export interface CellGroup {
  r1: number
  r2: number
  c1: number
  c2: number
}
export namespace CellGroup {
  export function areCellsMerged(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    cell1: number[],
    cell2: number[]
  ): boolean {
    const numGroups = dataModel.groupCount(rgn)
    const [row1, column1] = cell1
    const [row2, column2] = cell2
    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!
      if (
        row1 >= group.r1 &&
        row1 <= group.r2 &&
        column1 >= group.c1 &&
        column1 <= group.c2 &&
        row2 >= group.r1 &&
        row2 <= group.r2 &&
        column2 >= group.c1 &&
        column2 <= group.c2
      ) {
        return true
      }
    }
    return false
  }
  export function calculateMergeOffsets(
    dataModel: DataModel,
    regions: DataModel.CellRegion[],
    axis: "row" | "column",
    sectionList: SectionList,
    index: number
  ): [number, number, CellGroup] {
    let mergeStartOffset = 0
    let mergeEndOffset = 0
    let mergedCellGroups: CellGroup[] = []
    for (const region of regions) {
      mergedCellGroups = mergedCellGroups.concat(
        getCellGroupsAtRegion(dataModel, region)
      )
    }
    let groupsAtAxis: CellGroup[] = []
    if (axis === "row") {
      for (const region of regions) {
        groupsAtAxis = groupsAtAxis.concat(
          getCellGroupsAtRow(dataModel, region, index)
        )
      }
    } else {
      for (const region of regions) {
        groupsAtAxis = groupsAtAxis.concat(
          getCellGroupsAtColumn(dataModel, region, index)
        )
      }
    }
    if (groupsAtAxis.length === 0) {
      return [0, 0, { r1: -1, r2: -1, c1: -1, c2: -1 }]
    }
    let joinedGroup = groupsAtAxis[0]
    for (let g = 0; g < mergedCellGroups.length; g++) {
      const group = mergedCellGroups[g]
      if (areCellGroupsIntersectingAtAxis(joinedGroup, group, axis)) {
        joinedGroup = joinCellGroups([group, joinedGroup])
        mergedCellGroups.splice(g, 1)
        g = 0
      }
    }
    const minRow = joinedGroup.r1
    const maxRow = joinedGroup.r2
    for (let r = index - 1; r >= minRow; r--) {
      mergeStartOffset += sectionList.sizeOf(r)
    }
    for (let r = index + 1; r <= maxRow; r++) {
      mergeEndOffset += sectionList.sizeOf(r)
    }
    return [mergeStartOffset, mergeEndOffset, joinedGroup]
  }
  export function areCellGroupsIntersectingAtAxis(
    group1: CellGroup,
    group2: CellGroup,
    axis: "row" | "column"
  ): boolean {
    if (axis === "row") {
      return (
        (group1.r1 >= group2.r1 && group1.r1 <= group2.r2) ||
        (group1.r2 >= group2.r1 && group1.r2 <= group2.r2) ||
        (group2.r1 >= group1.r1 && group2.r1 <= group1.r2) ||
        (group2.r2 >= group1.r1 && group2.r2 <= group1.r2)
      )
    }
    return (
      (group1.c1 >= group2.c1 && group1.c1 <= group2.c2) ||
      (group1.c2 >= group2.c1 && group1.c2 <= group2.c2) ||
      (group2.c1 >= group1.c1 && group2.c1 <= group1.c2) ||
      (group2.c2 >= group1.c1 && group2.c2 <= group1.c2)
    )
  }
  export function areCellGroupsIntersecting(
    group1: CellGroup,
    group2: CellGroup
  ): boolean {
    return (
      ((group1.r1 >= group2.r1 && group1.r1 <= group2.r2) ||
        (group1.r2 >= group2.r1 && group1.r2 <= group2.r2) ||
        (group2.r1 >= group1.r1 && group2.r1 <= group1.r2) ||
        (group2.r2 >= group1.r1 && group2.r2 <= group1.r2)) &&
      ((group1.c1 >= group2.c1 && group1.c1 <= group2.c2) ||
        (group1.c2 >= group2.c1 && group1.c2 <= group2.c2) ||
        (group2.c1 >= group1.c1 && group2.c1 <= group1.c2) ||
        (group2.c2 >= group1.c1 && group2.c2 <= group1.c2))
    )
  }
  export function getGroupIndex(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    row: number,
    column: number
  ): number {
    const numGroups = dataModel.groupCount(rgn)
    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!
      if (
        row >= group.r1 &&
        row <= group.r2 &&
        column >= group.c1 &&
        column <= group.c2
      ) {
        return i
      }
    }
    return -1
  }
  export function getGroup(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    row: number,
    column: number
  ): CellGroup | null {
    const groupIndex = getGroupIndex(dataModel, rgn, row, column)
    if (groupIndex === -1) {
      return null
    }
    return dataModel.group(rgn, groupIndex)
  }
  export function getCellGroupsAtRegion(
    dataModel: DataModel,
    rgn: DataModel.CellRegion
  ): CellGroup[] {
    const groupsAtRegion: CellGroup[] = []
    const numGroups = dataModel.groupCount(rgn)
    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!
      groupsAtRegion.push(group)
    }
    return groupsAtRegion
  }
  export function joinCellGroups(groups: CellGroup[]): CellGroup {
    let startRow = Number.MAX_VALUE
    let endRow = Number.MIN_VALUE
    let startColumn = Number.MAX_VALUE
    let endColumn = Number.MIN_VALUE
    for (const group of groups) {
      startRow = Math.min(startRow, group.r1)
      endRow = Math.max(endRow, group.r2)
      startColumn = Math.min(startColumn, group.c1)
      endColumn = Math.max(endColumn, group.c2)
    }
    return { r1: startRow, r2: endRow, c1: startColumn, c2: endColumn }
  }
  export function joinCellGroupWithMergedCellGroups(
    dataModel: DataModel,
    group: CellGroup,
    region: DataModel.CellRegion
  ): CellGroup {
    let joinedGroup: CellGroup = { ...group }
    const mergedCellGroups: CellGroup[] = getCellGroupsAtRegion(
      dataModel,
      region
    )
    for (let g = 0; g < mergedCellGroups.length; g++) {
      const mergedGroup = mergedCellGroups[g]
      if (areCellGroupsIntersecting(joinedGroup, mergedGroup)) {
        joinedGroup = joinCellGroups([joinedGroup, mergedGroup])
      }
    }
    return joinedGroup
  }
  export function getCellGroupsAtRow(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    row: number
  ): CellGroup[] {
    const groupsAtRow = []
    const numGroups = dataModel.groupCount(rgn)
    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!
      if (row >= group.r1 && row <= group.r2) {
        groupsAtRow.push(group)
      }
    }
    return groupsAtRow
  }
  export function getCellGroupsAtColumn(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    column: number
  ): CellGroup[] {
    const groupsAtColumn = []
    const numGroups = dataModel.groupCount(rgn)
    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!
      if (column >= group.c1 && column <= group.c2) {
        groupsAtColumn.push(group)
      }
    }
    return groupsAtColumn
  }
  export function isCellGroupAbove(
    group1: CellGroup,
    group2: CellGroup
  ): boolean {
    return group2.r2 >= group1.r1
  }
  export function isCellGroupBelow(
    group1: CellGroup,
    group2: CellGroup
  ): boolean {
    return group2.r1 <= group1.r2
  }
  export function joinCellGroupsIntersectingAtAxis(
    dataModel: DataModel,
    regions: DataModel.CellRegion[],
    axis: "row" | "column",
    group: CellGroup
  ): CellGroup {
    let groupsAtAxis: CellGroup[] = []
    if (axis === "row") {
      for (const region of regions) {
        for (let r = group.r1; r <= group.r2; r++) {
          groupsAtAxis = groupsAtAxis.concat(
            CellGroup.getCellGroupsAtRow(dataModel, region, r)
          )
        }
      }
    } else {
      for (const region of regions) {
        for (let c = group.c1; c <= group.c2; c++) {
          groupsAtAxis = groupsAtAxis.concat(
            CellGroup.getCellGroupsAtColumn(dataModel, region, c)
          )
        }
      }
    }
    let mergedGroupAtAxis: CellGroup = CellGroup.joinCellGroups(groupsAtAxis)
    if (groupsAtAxis.length > 0) {
      let mergedCellGroups: CellGroup[] = []
      for (const region of regions) {
        mergedCellGroups = mergedCellGroups.concat(
          CellGroup.getCellGroupsAtRegion(dataModel, region)
        )
      }
      for (let g = 0; g < mergedCellGroups.length; g++) {
        const group = mergedCellGroups[g]
        if (
          CellGroup.areCellGroupsIntersectingAtAxis(
            mergedGroupAtAxis,
            group,
            axis
          )
        ) {
          mergedGroupAtAxis = CellGroup.joinCellGroups([
            group,
            mergedGroupAtAxis,
          ])
          mergedCellGroups.splice(g, 1)
          g = 0
        }
      }
    }
    return mergedGroupAtAxis
  }
}
export abstract class CellRenderer {
  abstract paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void
}
export namespace CellRenderer {
  export type CellConfig = {
    readonly x: number
    readonly y: number
    readonly height: number
    readonly width: number
    readonly region: DataModel.CellRegion
    readonly row: number
    readonly column: number
    readonly value: any
    readonly metadata: DataModel.Metadata
  }
  export type ConfigFunc<T> = (config: CellConfig) => T
  export type ConfigOption<T> = T | ConfigFunc<T>
  export function resolveOption<T>(
    option: ConfigOption<T>,
    config: CellConfig
  ): T {
    return typeof option === "function"
      ? (option as ConfigFunc<T>)(config)
      : option
  }
}
export class DataGrid extends Widget {
  constructor(options: DataGrid.IOptions = {}) {
    super()
    this.addClass("lm-DataGrid")
    this._style = options.style || DataGrid.defaultStyle
    this._stretchLastRow = options.stretchLastRow || false
    this._stretchLastColumn = options.stretchLastColumn || false
    this._headerVisibility = options.headerVisibility || "all"
    this._cellRenderers = options.cellRenderers || new RendererMap()
    this._copyConfig = options.copyConfig || DataGrid.defaultCopyConfig
    this._cellRenderers.changed.connect(this._onRenderersChanged, this)
    const defaultSizes = options.defaultSizes || DataGrid.defaultSizes
    const minimumSizes = options.minimumSizes || DataGrid.minimumSizes
    this._rowSections = new SectionList({
      defaultSize: defaultSizes.rowHeight,
      minimumSize: minimumSizes.rowHeight,
    })
    this._columnSections = new SectionList({
      defaultSize: defaultSizes.columnWidth,
      minimumSize: minimumSizes.columnWidth,
    })
    this._rowHeaderSections = new SectionList({
      defaultSize: defaultSizes.rowHeaderWidth,
      minimumSize: minimumSizes.rowHeaderWidth,
    })
    this._columnHeaderSections = new SectionList({
      defaultSize: defaultSizes.columnHeaderHeight,
      minimumSize: minimumSizes.columnHeaderHeight,
    })
    this._canvas = Private.createCanvas()
    this._buffer = Private.createCanvas()
    this._overlay = Private.createCanvas()
    this._canvasGC = this._canvas.getContext("2d")!
    this._bufferGC = this._buffer.getContext("2d")!
    this._overlayGC = this._overlay.getContext("2d")!
    this._canvas.style.position = "absolute"
    this._canvas.style.top = "0px"
    this._canvas.style.left = "0px"
    this._canvas.style.width = "0px"
    this._canvas.style.height = "0px"
    this._overlay.style.position = "absolute"
    this._overlay.style.top = "0px"
    this._overlay.style.left = "0px"
    this._overlay.style.width = "0px"
    this._overlay.style.height = "0px"
    this._viewport = new Widget()
    this._viewport.node.tabIndex = -1
    this._viewport.node.style.outline = "none"
    this._vScrollBar = new ScrollBar({ orientation: "vertical" })
    this._hScrollBar = new ScrollBar({ orientation: "horizontal" })
    this._scrollCorner = new Widget()
    this._editorController = new CellEditorController()
    this._viewport.addClass("lm-DataGrid-viewport")
    this._vScrollBar.addClass("lm-DataGrid-scrollBar")
    this._hScrollBar.addClass("lm-DataGrid-scrollBar")
    this._scrollCorner.addClass("lm-DataGrid-scrollCorner")
    this._viewport.node.appendChild(this._canvas)
    this._viewport.node.appendChild(this._overlay)
    MessageLoop.installMessageHook(this._viewport, this)
    MessageLoop.installMessageHook(this._hScrollBar, this)
    MessageLoop.installMessageHook(this._vScrollBar, this)
    this._vScrollBar.hide()
    this._hScrollBar.hide()
    this._scrollCorner.hide()
    this._vScrollBar.thumbMoved.connect(this._onThumbMoved, this)
    this._hScrollBar.thumbMoved.connect(this._onThumbMoved, this)
    this._vScrollBar.pageRequested.connect(this._onPageRequested, this)
    this._hScrollBar.pageRequested.connect(this._onPageRequested, this)
    this._vScrollBar.stepRequested.connect(this._onStepRequested, this)
    this._hScrollBar.stepRequested.connect(this._onStepRequested, this)
    GridLayout.setCellConfig(this._viewport, { row: 0, column: 0 })
    GridLayout.setCellConfig(this._vScrollBar, { row: 0, column: 1 })
    GridLayout.setCellConfig(this._hScrollBar, { row: 1, column: 0 })
    GridLayout.setCellConfig(this._scrollCorner, { row: 1, column: 1 })
    const layout = new GridLayout({
      rowCount: 2,
      columnCount: 2,
      rowSpacing: 0,
      columnSpacing: 0,
      fitPolicy: "set-no-constraint",
    })
    layout.setRowStretch(0, 1)
    layout.setRowStretch(1, 0)
    layout.setColumnStretch(0, 1)
    layout.setColumnStretch(1, 0)
    layout.addWidget(this._viewport)
    layout.addWidget(this._vScrollBar)
    layout.addWidget(this._hScrollBar)
    layout.addWidget(this._scrollCorner)
    this.layout = layout
  }
  dispose(): void {
    this._releaseMouse()
    if (this._keyHandler) {
      this._keyHandler.dispose()
    }
    if (this._mouseHandler) {
      this._mouseHandler.dispose()
    }
    this._keyHandler = null
    this._mouseHandler = null
    this._dataModel = null
    this._selectionModel = null
    this._rowSections.clear()
    this._columnSections.clear()
    this._rowHeaderSections.clear()
    this._columnHeaderSections.clear()
    super.dispose()
  }
  get dataModel(): DataModel | null {
    return this._dataModel
  }
  set dataModel(value: DataModel | null) {
    if (this._dataModel === value) {
      return
    }
    this._releaseMouse()
    this.selectionModel = null
    if (this._dataModel) {
      this._dataModel.changed.disconnect(this._onDataModelChanged, this)
    }
    if (value) {
      value.changed.connect(this._onDataModelChanged, this)
    }
    this._dataModel = value
    this._rowSections.clear()
    this._columnSections.clear()
    this._rowHeaderSections.clear()
    this._columnHeaderSections.clear()
    if (value) {
      this._rowSections.insert(0, value.rowCount("body"))
      this._columnSections.insert(0, value.columnCount("body"))
      this._rowHeaderSections.insert(0, value.columnCount("row-header"))
      this._columnHeaderSections.insert(0, value.rowCount("column-header"))
    }
    this._scrollX = 0
    this._scrollY = 0
    this._syncViewport()
  }
  get selectionModel(): SelectionModel | null {
    return this._selectionModel
  }
  set selectionModel(value: SelectionModel | null) {
    if (this._selectionModel === value) {
      return
    }
    this._releaseMouse()
    if (value && value.dataModel !== this._dataModel) {
      throw new Error("SelectionModel.dataModel !== DataGrid.dataModel")
    }
    if (this._selectionModel) {
      this._selectionModel.changed.disconnect(this._onSelectionsChanged, this)
    }
    if (value) {
      value.changed.connect(this._onSelectionsChanged, this)
    }
    this._selectionModel = value
    this.repaintOverlay()
  }
  get keyHandler(): DataGrid.IKeyHandler | null {
    return this._keyHandler
  }
  set keyHandler(value: DataGrid.IKeyHandler | null) {
    this._keyHandler = value
  }
  get mouseHandler(): DataGrid.IMouseHandler | null {
    return this._mouseHandler
  }
  set mouseHandler(value: DataGrid.IMouseHandler | null) {
    if (this._mouseHandler === value) {
      return
    }
    this._releaseMouse()
    this._mouseHandler = value
  }
  get style(): DataGrid.Style {
    return this._style
  }
  set style(value: DataGrid.Style) {
    if (this._style === value) {
      return
    }
    this._style = { ...value }
    this.repaintContent()
    this.repaintOverlay()
  }
  get cellRenderers(): RendererMap {
    return this._cellRenderers
  }
  set cellRenderers(value: RendererMap) {
    if (this._cellRenderers === value) {
      return
    }
    this._cellRenderers.changed.disconnect(this._onRenderersChanged, this)
    value.changed.connect(this._onRenderersChanged, this)
    this._cellRenderers = value
    this.repaintContent()
  }
  get headerVisibility(): DataGrid.HeaderVisibility {
    return this._headerVisibility
  }
  set headerVisibility(value: DataGrid.HeaderVisibility) {
    if (this._headerVisibility === value) {
      return
    }
    this._headerVisibility = value
    this._syncViewport()
  }
  get defaultSizes(): DataGrid.DefaultSizes {
    const rowHeight = this._rowSections.defaultSize
    const columnWidth = this._columnSections.defaultSize
    const rowHeaderWidth = this._rowHeaderSections.defaultSize
    const columnHeaderHeight = this._columnHeaderSections.defaultSize
    return { rowHeight, columnWidth, rowHeaderWidth, columnHeaderHeight }
  }
  set defaultSizes(value: DataGrid.DefaultSizes) {
    this._rowSections.defaultSize = value.rowHeight
    this._columnSections.defaultSize = value.columnWidth
    this._rowHeaderSections.defaultSize = value.rowHeaderWidth
    this._columnHeaderSections.defaultSize = value.columnHeaderHeight
    this._syncViewport()
  }
  get minimumSizes(): DataGrid.DefaultSizes {
    const rowHeight = this._rowSections.minimumSize
    const columnWidth = this._columnSections.minimumSize
    const rowHeaderWidth = this._rowHeaderSections.minimumSize
    const columnHeaderHeight = this._columnHeaderSections.minimumSize
    return { rowHeight, columnWidth, rowHeaderWidth, columnHeaderHeight }
  }
  set minimumSizes(value: DataGrid.DefaultSizes) {
    this._rowSections.minimumSize = value.rowHeight
    this._columnSections.minimumSize = value.columnWidth
    this._rowHeaderSections.minimumSize = value.rowHeaderWidth
    this._columnHeaderSections.minimumSize = value.columnHeaderHeight
    this._syncViewport()
  }
  get copyConfig(): DataGrid.CopyConfig {
    return this._copyConfig
  }
  set copyConfig(value: DataGrid.CopyConfig) {
    this._copyConfig = value
  }
  get stretchLastRow(): boolean {
    return this._stretchLastRow
  }
  set stretchLastRow(value: boolean) {
    if (value === this._stretchLastRow) {
      return
    }
    this._stretchLastRow = value
    this._syncViewport()
  }
  get stretchLastColumn(): boolean {
    return this._stretchLastColumn
  }
  set stretchLastColumn(value: boolean) {
    if (value === this._stretchLastColumn) {
      return
    }
    this._stretchLastColumn = value
    this._syncViewport()
  }
  get headerWidth(): number {
    if (this._headerVisibility === "none") {
      return 0
    }
    if (this._headerVisibility === "column") {
      return 0
    }
    return this._rowHeaderSections.length
  }
  get headerHeight(): number {
    if (this._headerVisibility === "none") {
      return 0
    }
    if (this._headerVisibility === "row") {
      return 0
    }
    return this._columnHeaderSections.length
  }
  get bodyWidth(): number {
    return this._columnSections.length
  }
  get bodyHeight(): number {
    return this._rowSections.length
  }
  get totalWidth(): number {
    return this.headerWidth + this.bodyWidth
  }
  get totalHeight(): number {
    return this.headerHeight + this.bodyHeight
  }
  get viewportWidth(): number {
    return this._viewportWidth
  }
  get viewportHeight(): number {
    return this._viewportHeight
  }
  get pageWidth(): number {
    return Math.max(0, this.viewportWidth - this.headerWidth)
  }
  get pageHeight(): number {
    return Math.max(0, this.viewportHeight - this.headerHeight)
  }
  get scrollX(): number {
    return this._hScrollBar.value
  }
  get scrollY(): number {
    return this._vScrollBar.value
  }
  get maxScrollX(): number {
    return Math.max(0, this.bodyWidth - this.pageWidth - 1)
  }
  get maxScrollY(): number {
    return Math.max(0, this.bodyHeight - this.pageHeight - 1)
  }
  get viewport(): Widget {
    return this._viewport
  }
  get editorController(): ICellEditorController | null {
    return this._editorController
  }
  set editorController(controller: ICellEditorController | null) {
    this._editorController = controller
  }
  get editingEnabled(): boolean {
    return this._editingEnabled
  }
  set editingEnabled(enabled: boolean) {
    this._editingEnabled = enabled
  }
  get editable(): boolean {
    return (
      this._editingEnabled &&
      this._selectionModel !== null &&
      this._editorController !== null &&
      this.dataModel instanceof MutableDataModel
    )
  }
  protected get canvasGC(): CanvasRenderingContext2D {
    return this._canvasGC
  }
  protected get rowSections(): SectionList {
    return this._rowSections
  }
  protected get columnSections(): SectionList {
    return this._columnSections
  }
  protected get rowHeaderSections(): SectionList {
    return this._rowHeaderSections
  }
  protected get columnHeaderSections(): SectionList {
    return this._columnHeaderSections
  }
  scrollToRow(row: number): void {
    const nr = this._rowSections.count
    if (nr === 0) {
      return
    }
    row = Math.floor(row)
    row = Math.max(0, Math.min(row, nr - 1))
    const y1 = this._rowSections.offsetOf(row)
    const y2 = this._rowSections.extentOf(row)
    const vy1 = this._scrollY
    const vy2 = this._scrollY + this.pageHeight - 1
    let dy = 0
    if (y1 < vy1) {
      dy = y1 - vy1 - 10
    } else if (y2 > vy2) {
      dy = y2 - vy2 + 10
    }
    if (dy === 0) {
      return
    }
    this.scrollBy(0, dy)
  }
  scrollToColumn(column: number): void {
    const nc = this._columnSections.count
    if (nc === 0) {
      return
    }
    column = Math.floor(column)
    column = Math.max(0, Math.min(column, nc - 1))
    const x1 = this._columnSections.offsetOf(column)
    const x2 = this._columnSections.extentOf(column)
    const vx1 = this._scrollX
    const vx2 = this._scrollX + this.pageWidth - 1
    let dx = 0
    if (x1 < vx1) {
      dx = x1 - vx1 - 10
    } else if (x2 > vx2) {
      dx = x2 - vx2 + 10
    }
    if (dx === 0) {
      return
    }
    this.scrollBy(dx, 0)
  }
  scrollToCell(row: number, column: number): void {
    const nr = this._rowSections.count
    const nc = this._columnSections.count
    if (nr === 0 || nc === 0) {
      return
    }
    row = Math.floor(row)
    column = Math.floor(column)
    row = Math.max(0, Math.min(row, nr - 1))
    column = Math.max(0, Math.min(column, nc - 1))
    const x1 = this._columnSections.offsetOf(column)
    const x2 = this._columnSections.extentOf(column)
    const y1 = this._rowSections.offsetOf(row)
    const y2 = this._rowSections.extentOf(row)
    const vx1 = this._scrollX
    const vx2 = this._scrollX + this.pageWidth - 1
    const vy1 = this._scrollY
    const vy2 = this._scrollY + this.pageHeight - 1
    let dx = 0
    let dy = 0
    if (x1 < vx1) {
      dx = x1 - vx1 - 10
    } else if (x2 > vx2) {
      dx = x2 - vx2 + 10
    }
    if (y1 < vy1) {
      dy = y1 - vy1 - 10
    } else if (y2 > vy2) {
      dy = y2 - vy2 + 10
    }
    if (dx === 0 && dy === 0) {
      return
    }
    this.scrollBy(dx, dy)
  }
  moveCursor(direction: SelectionModel.CursorMoveDirection): void {
    if (
      !this.dataModel ||
      !this._selectionModel ||
      this._selectionModel.isEmpty
    ) {
      return
    }
    const iter = this._selectionModel.selections()
    const onlyOne = iter.next() && !iter.next()
    if (onlyOne) {
      const currentSel = this._selectionModel.currentSelection()!
      if (currentSel.r1 === currentSel.r2 && currentSel.c1 === currentSel.c2) {
        const dr = direction === "down" ? 1 : direction === "up" ? -1 : 0
        const dc = direction === "right" ? 1 : direction === "left" ? -1 : 0
        let newRow = currentSel.r1 + dr
        let newColumn = currentSel.c1 + dc
        const rowCount = this.dataModel.rowCount("body")
        const columnCount = this.dataModel.columnCount("body")
        if (newRow >= rowCount) {
          newRow = 0
          newColumn += 1
        } else if (newRow === -1) {
          newRow = rowCount - 1
          newColumn -= 1
        }
        if (newColumn >= columnCount) {
          newColumn = 0
          newRow += 1
          if (newRow >= rowCount) {
            newRow = 0
          }
        } else if (newColumn === -1) {
          newColumn = columnCount - 1
          newRow -= 1
          if (newRow === -1) {
            newRow = rowCount - 1
          }
        }
        this._selectionModel.select({
          r1: newRow,
          c1: newColumn,
          r2: newRow,
          c2: newColumn,
          cursorRow: newRow,
          cursorColumn: newColumn,
          clear: "all",
        })
        return
      }
    }
    this._selectionModel.moveCursorWithinSelections(direction)
  }
  scrollToCursor(): void {
    if (!this._selectionModel) {
      return
    }
    const row = this._selectionModel.cursorRow
    const column = this._selectionModel.cursorColumn
    this.scrollToCell(row, column)
  }
  scrollBy(dx: number, dy: number): void {
    this.scrollTo(this.scrollX + dx, this.scrollY + dy)
  }
  scrollByPage(dir: "up" | "down" | "left" | "right"): void {
    let dx = 0
    let dy = 0
    switch (dir) {
      case "up":
        dy = -this.pageHeight
        break
      case "down":
        dy = this.pageHeight
        break
      case "left":
        dx = -this.pageWidth
        break
      case "right":
        dx = this.pageWidth
        break
      default:
        throw "unreachable"
    }
    this.scrollTo(this.scrollX + dx, this.scrollY + dy)
  }
  scrollByStep(dir: "up" | "down" | "left" | "right"): void {
    let r: number
    let c: number
    let x = this.scrollX
    let y = this.scrollY
    const rows = this._rowSections
    const columns = this._columnSections
    switch (dir) {
      case "up":
        r = rows.indexOf(y - 1)
        y = r < 0 ? y : rows.offsetOf(r)
        break
      case "down":
        r = rows.indexOf(y)
        y = r < 0 ? y : rows.offsetOf(r) + rows.sizeOf(r)
        break
      case "left":
        c = columns.indexOf(x - 1)
        x = c < 0 ? x : columns.offsetOf(c)
        break
      case "right":
        c = columns.indexOf(x)
        x = c < 0 ? x : columns.offsetOf(c) + columns.sizeOf(c)
        break
      default:
        throw "unreachable"
    }
    this.scrollTo(x, y)
  }
  scrollTo(x: number, y: number): void {
    x = Math.max(0, Math.min(Math.floor(x), this.maxScrollX))
    y = Math.max(0, Math.min(Math.floor(y), this.maxScrollY))
    this._hScrollBar.value = x
    this._vScrollBar.value = y
    MessageLoop.postMessage(this._viewport, Private.ScrollRequest)
  }
  rowCount(region: DataModel.RowRegion): number {
    let count: number
    if (region === "body") {
      count = this._rowSections.count
    } else {
      count = this._columnHeaderSections.count
    }
    return count
  }
  columnCount(region: DataModel.ColumnRegion): number {
    let count: number
    if (region === "body") {
      count = this._columnSections.count
    } else {
      count = this._rowHeaderSections.count
    }
    return count
  }
  rowAt(region: DataModel.RowRegion, offset: number): number {
    if (offset < 0) {
      return -1
    }
    if (region === "column-header") {
      return this._columnHeaderSections.indexOf(offset)
    }
    const index = this._rowSections.indexOf(offset)
    if (index >= 0) {
      return index
    }
    if (!this._stretchLastRow) {
      return -1
    }
    const bh = this.bodyHeight
    const ph = this.pageHeight
    if (ph <= bh) {
      return -1
    }
    if (offset >= ph) {
      return -1
    }
    return this._rowSections.count - 1
  }
  columnAt(region: DataModel.ColumnRegion, offset: number): number {
    if (offset < 0) {
      return -1
    }
    if (region === "row-header") {
      return this._rowHeaderSections.indexOf(offset)
    }
    const index = this._columnSections.indexOf(offset)
    if (index >= 0) {
      return index
    }
    if (!this._stretchLastColumn) {
      return -1
    }
    const bw = this.bodyWidth
    const pw = this.pageWidth
    if (pw <= bw) {
      return -1
    }
    if (offset >= pw) {
      return -1
    }
    return this._columnSections.count - 1
  }
  rowOffset(region: DataModel.RowRegion, index: number): number {
    let offset: number
    if (region === "body") {
      offset = this._rowSections.offsetOf(index)
    } else {
      offset = this._columnHeaderSections.offsetOf(index)
    }
    return offset
  }
  columnOffset(region: DataModel.ColumnRegion, index: number): number {
    let offset: number
    if (region === "body") {
      offset = this._columnSections.offsetOf(index)
    } else {
      offset = this._rowHeaderSections.offsetOf(index)
    }
    return offset
  }
  rowSize(region: DataModel.RowRegion, index: number): number {
    if (region === "column-header") {
      return this._columnHeaderSections.sizeOf(index)
    }
    const size = this._rowSections.sizeOf(index)
    if (size < 0) {
      return size
    }
    if (!this._stretchLastRow) {
      return size
    }
    if (index < this._rowSections.count - 1) {
      return size
    }
    const bh = this.bodyHeight
    const ph = this.pageHeight
    if (ph <= bh) {
      return size
    }
    return size + (ph - bh)
  }
  columnSize(region: DataModel.ColumnRegion, index: number): number {
    if (region === "row-header") {
      return this._rowHeaderSections.sizeOf(index)
    }
    const size = this._columnSections.sizeOf(index)
    if (size < 0) {
      return size
    }
    if (!this._stretchLastColumn) {
      return size
    }
    if (index < this._columnSections.count - 1) {
      return size
    }
    const bw = this.bodyWidth
    const pw = this.pageWidth
    if (pw <= bw) {
      return size
    }
    return size + (pw - bw)
  }
  resizeRow(region: DataModel.RowRegion, index: number, size: number): void {
    const msg = new Private.RowResizeRequest(region, index, size)
    MessageLoop.postMessage(this._viewport, msg)
  }
  resizeColumn(
    region: DataModel.ColumnRegion,
    index: number,
    size: number
  ): void {
    const msg = new Private.ColumnResizeRequest(region, index, size)
    MessageLoop.postMessage(this._viewport, msg)
  }
  resetRows(region: DataModel.RowRegion | "all"): void {
    switch (region) {
      case "all":
        this._rowSections.reset()
        this._columnHeaderSections.reset()
        break
      case "body":
        this._rowSections.reset()
        break
      case "column-header":
        this._columnHeaderSections.reset()
        break
      default:
        throw "unreachable"
    }
    this.repaintContent()
    this.repaintOverlay()
  }
  resetColumns(region: DataModel.ColumnRegion | "all"): void {
    switch (region) {
      case "all":
        this._columnSections.reset()
        this._rowHeaderSections.reset()
        break
      case "body":
        this._columnSections.reset()
        break
      case "row-header":
        this._rowHeaderSections.reset()
        break
      default:
        throw "unreachable"
    }
    this.repaintContent()
    this.repaintOverlay()
  }
  fitColumnNames(
    area: DataGrid.ColumnFitType = "all",
    padding: number = 15,
    numCols?: number
  ): void {
    if (this.dataModel) {
      let colsRemaining =
        numCols === undefined || numCols < 0 ? undefined : numCols
      if (area === "row-header" || area === "all") {
        if (colsRemaining !== undefined) {
          const rowColumnCount = this.dataModel.columnCount("row-header")
          if (colsRemaining - rowColumnCount < 0) {
            this._fitRowColumnHeaders(this.dataModel, padding, colsRemaining)
            colsRemaining = 0
          } else {
            this._fitRowColumnHeaders(this.dataModel, padding, rowColumnCount)
            colsRemaining = colsRemaining - rowColumnCount
          }
        } else {
          this._fitRowColumnHeaders(this.dataModel, padding)
        }
      }
      if (area === "body" || area === "all") {
        if (colsRemaining !== undefined) {
          const bodyColumnCount = this.dataModel.columnCount("body")
          if (colsRemaining - bodyColumnCount < 0) {
            this._fitBodyColumnHeaders(this.dataModel, padding, colsRemaining)
            colsRemaining = 0
          } else {
            this._fitBodyColumnHeaders(
              this.dataModel,
              padding,
              Math.min(colsRemaining, bodyColumnCount)
            )
          }
        } else {
          this._fitBodyColumnHeaders(this.dataModel, padding)
        }
      }
    }
  }
  mapToLocal(clientX: number, clientY: number): { lx: number; ly: number } {
    const rect = this._viewport.node.getBoundingClientRect()
    let { left, top } = rect
    left = Math.floor(left)
    top = Math.floor(top)
    const lx = clientX - left
    const ly = clientY - top
    return { lx, ly }
  }
  mapToVirtual(clientX: number, clientY: number): { vx: number; vy: number } {
    const { lx, ly } = this.mapToLocal(clientX, clientY)
    const vx = lx + this.scrollX - this.headerWidth
    const vy = ly + this.scrollY - this.headerHeight
    return { vx, vy }
  }
  hitTest(clientX: number, clientY: number): DataGrid.HitTestResult {
    const { lx, ly } = this.mapToLocal(clientX, clientY)
    const hw = this.headerWidth
    const hh = this.headerHeight
    let bw = this.bodyWidth
    let bh = this.bodyHeight
    const ph = this.pageHeight
    const pw = this.pageWidth
    if (this._stretchLastColumn && pw > bw) {
      bw = pw
    }
    if (this._stretchLastRow && ph > bh) {
      bh = ph
    }
    if (lx >= 0 && lx < hw && ly >= 0 && ly < hh) {
      const vx = lx
      const vy = ly
      const row = this.rowAt("column-header", vy)
      const column = this.columnAt("row-header", vx)
      const ox = this.columnOffset("row-header", column)
      const oy = this.rowOffset("column-header", row)
      const width = this.columnSize("row-header", column)
      const height = this.rowSize("column-header", row)
      const x = vx - ox
      const y = vy - oy
      return { region: "corner-header", row, column, x, y, width, height }
    }
    if (ly >= 0 && ly < hh && lx >= 0 && lx < hw + bw) {
      const vx = lx + this._scrollX - hw
      const vy = ly
      const row = this.rowAt("column-header", vy)
      const column = this.columnAt("body", vx)
      const ox = this.columnOffset("body", column)
      const oy = this.rowOffset("column-header", row)
      const width = this.columnSize("body", column)
      const height = this.rowSize("column-header", row)
      const x = vx - ox
      const y = vy - oy
      return { region: "column-header", row, column, x, y, width, height }
    }
    if (lx >= 0 && lx < hw && ly >= 0 && ly < hh + bh) {
      const vx = lx
      const vy = ly + this._scrollY - hh
      const row = this.rowAt("body", vy)
      const column = this.columnAt("row-header", vx)
      const ox = this.columnOffset("row-header", column)
      const oy = this.rowOffset("body", row)
      const width = this.columnSize("row-header", column)
      const height = this.rowSize("body", row)
      const x = vx - ox
      const y = vy - oy
      return { region: "row-header", row, column, x, y, width, height }
    }
    if (lx >= hw && lx < hw + bw && ly >= hh && ly < hh + bh) {
      const vx = lx + this._scrollX - hw
      const vy = ly + this._scrollY - hh
      const row = this.rowAt("body", vy)
      const column = this.columnAt("body", vx)
      const ox = this.columnOffset("body", column)
      const oy = this.rowOffset("body", row)
      const width = this.columnSize("body", column)
      const height = this.rowSize("body", row)
      const x = vx - ox
      const y = vy - oy
      return { region: "body", row, column, x, y, width, height }
    }
    const row = -1
    const column = -1
    const x = -1
    const y = -1
    const width = -1
    const height = -1
    return { region: "void", row, column, x, y, width, height }
  }
  copyToClipboard(): void {
    const dataModel = this._dataModel
    if (!dataModel) {
      return
    }
    const selectionModel = this._selectionModel
    if (!selectionModel) {
      return
    }
    const selections = Array.from(selectionModel.selections())
    if (selections.length === 0) {
      return
    }
    if (selections.length > 1) {
      alert("Cannot copy multiple grid selections.")
      return
    }
    const br = dataModel.rowCount("body")
    const bc = dataModel.columnCount("body")
    if (br === 0 || bc === 0) {
      return
    }
    let { r1, c1, r2, c2 } = selections[0]
    r1 = Math.max(0, Math.min(r1, br - 1))
    c1 = Math.max(0, Math.min(c1, bc - 1))
    r2 = Math.max(0, Math.min(r2, br - 1))
    c2 = Math.max(0, Math.min(c2, bc - 1))
    if (r2 < r1) [r1, r2] = [r2, r1]
    if (c2 < c1) [c1, c2] = [c2, c1]
    let rhc = dataModel.columnCount("row-header")
    let chr = dataModel.rowCount("column-header")
    const separator = this._copyConfig.separator
    const format = this._copyConfig.format
    const headers = this._copyConfig.headers
    const warningThreshold = this._copyConfig.warningThreshold
    let rowCount = r2 - r1 + 1
    let colCount = c2 - c1 + 1
    switch (headers) {
      case "none":
        rhc = 0
        chr = 0
        break
      case "row":
        chr = 0
        colCount += rhc
        break
      case "column":
        rhc = 0
        rowCount += chr
        break
      case "all":
        rowCount += chr
        colCount += rhc
        break
      default:
        throw "unreachable"
    }
    const cellCount = rowCount * colCount
    if (cellCount > warningThreshold) {
      const msg = `Copying ${cellCount} cells may take a while. Continue?`
      if (!window.confirm(msg)) {
        return
      }
    }
    const args = {
      region: "body" as DataModel.CellRegion,
      row: 0,
      column: 0,
      value: null as any,
      metadata: {} as DataModel.Metadata,
    }
    const rows = new Array<string[]>(rowCount)
    for (let j = 0; j < rowCount; ++j) {
      const cells = new Array<string>(colCount)
      for (let i = 0; i < colCount; ++i) {
        let region: DataModel.CellRegion
        let row: number
        let column: number
        if (j < chr && i < rhc) {
          region = "corner-header"
          row = j
          column = i
        } else if (j < chr) {
          region = "column-header"
          row = j
          column = i - rhc + c1
        } else if (i < rhc) {
          region = "row-header"
          row = j - chr + r1
          column = i
        } else {
          region = "body"
          row = j - chr + r1
          column = i - rhc + c1
        }
        args.region = region
        args.row = row
        args.column = column
        args.value = dataModel.data(region, row, column)
        args.metadata = dataModel.metadata(region, row, column)
        cells[i] = format(args)
      }
      rows[j] = cells
    }
    const lines = rows.map(cells => cells.join(separator))
    const text = lines.join("\n")
    ClipboardExt.copyText(text)
  }
  processMessage(msg: Message): void {
    if (msg.type === "child-shown" || msg.type === "child-hidden") {
      return
    }
    if (msg.type === "fit-request") {
      const vsbLimits = ElementExt.sizeLimits(this._vScrollBar.node)
      const hsbLimits = ElementExt.sizeLimits(this._hScrollBar.node)
      this._vScrollBarMinWidth = vsbLimits.minWidth
      this._hScrollBarMinHeight = hsbLimits.minHeight
    }
    super.processMessage(msg)
  }
  messageHook(handler: IMessageHandler, msg: Message): boolean {
    if (handler === this._viewport) {
      this._processViewportMessage(msg)
      return true
    }
    if (handler === this._hScrollBar && msg.type === "activate-request") {
      this.activate()
      return false
    }
    if (handler === this._vScrollBar && msg.type === "activate-request") {
      this.activate()
      return false
    }
    return true
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
      case "mouseup":
        this._evtMouseUp(event as MouseEvent)
        break
      case "dblclick":
        this._evtMouseDoubleClick(event as MouseEvent)
        break
      case "mouseleave":
        this._evtMouseLeave(event as MouseEvent)
        break
      case "contextmenu":
        this._evtContextMenu(event as MouseEvent)
        break
      case "wheel":
        this._evtWheel(event as WheelEvent)
        break
      case "resize":
        this._refreshDPI()
        break
    }
  }
  protected onActivateRequest(msg: Message): void {
    this.viewport.node.focus({ preventScroll: true })
  }
  protected onBeforeAttach(msg: Message): void {
    window.addEventListener("resize", this)
    this.node.addEventListener("wheel", this)
    this._viewport.node.addEventListener("keydown", this)
    this._viewport.node.addEventListener("mousedown", this)
    this._viewport.node.addEventListener("mousemove", this)
    this._viewport.node.addEventListener("dblclick", this)
    this._viewport.node.addEventListener("mouseleave", this)
    this._viewport.node.addEventListener("contextmenu", this)
    this.repaintContent()
    this.repaintOverlay()
  }
  protected onAfterDetach(msg: Message): void {
    window.removeEventListener("resize", this)
    this.node.removeEventListener("wheel", this)
    this._viewport.node.removeEventListener("keydown", this)
    this._viewport.node.removeEventListener("mousedown", this)
    this._viewport.node.removeEventListener("mousemove", this)
    this._viewport.node.removeEventListener("mouseleave", this)
    this._viewport.node.removeEventListener("dblclick", this)
    this._viewport.node.removeEventListener("contextmenu", this)
    this._releaseMouse()
  }
  protected onBeforeShow(msg: Message): void {
    this.repaintContent()
    this.repaintOverlay()
  }
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this._editorController) {
      this._editorController.cancel()
    }
    this._syncScrollState()
  }
  protected repaintContent(): void {
    const msg = new Private.PaintRequest("all", 0, 0, 0, 0)
    MessageLoop.postMessage(this._viewport, msg)
  }
  protected repaintRegion(
    region: DataModel.CellRegion,
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): void {
    const msg = new Private.PaintRequest(region, r1, c1, r2, c2)
    MessageLoop.postMessage(this._viewport, msg)
  }
  protected repaintOverlay(): void {
    MessageLoop.postMessage(this._viewport, Private.OverlayPaintRequest)
  }
  private _resizeCanvasIfNeeded(width: number, height: number): void {
    width = width * this._dpiRatio
    height = height * this._dpiRatio
    const maxW = (Math.ceil((width + 1) / 512) + 1) * 512
    const maxH = (Math.ceil((height + 1) / 512) + 1) * 512
    const curW = this._canvas.width
    const curH = this._canvas.height
    if (curW >= width && curH >= height && curW <= maxW && curH <= maxH) {
      return
    }
    const expW = maxW - 512
    const expH = maxH - 512
    this._canvasGC.setTransform(1, 0, 0, 1, 0, 0)
    this._bufferGC.setTransform(1, 0, 0, 1, 0, 0)
    this._overlayGC.setTransform(1, 0, 0, 1, 0, 0)
    if (curW < width) {
      this._buffer.width = expW
    } else if (curW > maxW) {
      this._buffer.width = maxW
    }
    if (curH < height) {
      this._buffer.height = expH
    } else if (curH > maxH) {
      this._buffer.height = maxH
    }
    const needBlit = curH > 0 && curH > 0 && width > 0 && height > 0
    if (needBlit) {
      this._bufferGC.drawImage(this._canvas, 0, 0)
    }
    if (curW < width) {
      this._canvas.width = expW
      this._canvas.style.width = `${expW / this._dpiRatio}px`
    } else if (curW > maxW) {
      this._canvas.width = maxW
      this._canvas.style.width = `${maxW / this._dpiRatio}px`
    }
    if (curH < height) {
      this._canvas.height = expH
      this._canvas.style.height = `${expH / this._dpiRatio}px`
    } else if (curH > maxH) {
      this._canvas.height = maxH
      this._canvas.style.height = `${maxH / this._dpiRatio}px`
    }
    if (needBlit) {
      this._canvasGC.drawImage(this._buffer, 0, 0)
    }
    if (needBlit) {
      this._bufferGC.drawImage(this._overlay, 0, 0)
    }
    if (curW < width) {
      this._overlay.width = expW
      this._overlay.style.width = `${expW / this._dpiRatio}px`
    } else if (curW > maxW) {
      this._overlay.width = maxW
      this._overlay.style.width = `${maxW / this._dpiRatio}px`
    }
    if (curH < height) {
      this._overlay.height = expH
      this._overlay.style.height = `${expH / this._dpiRatio}px`
    } else if (curH > maxH) {
      this._overlay.height = maxH
      this._overlay.style.height = `${maxH / this._dpiRatio}px`
    }
    if (needBlit) {
      this._overlayGC.drawImage(this._buffer, 0, 0)
    }
  }
  private _syncScrollState(): void {
    const bw = this.bodyWidth
    const bh = this.bodyHeight
    const pw = this.pageWidth
    const ph = this.pageHeight
    const hasVScroll = !this._vScrollBar.isHidden
    const hasHScroll = !this._hScrollBar.isHidden
    const vsw = this._vScrollBarMinWidth
    const hsh = this._hScrollBarMinHeight
    const apw = pw + (hasVScroll ? vsw : 0)
    const aph = ph + (hasHScroll ? hsh : 0)
    let needVScroll = aph < bh - 1
    let needHScroll = apw < bw - 1
    if (needVScroll && !needHScroll) {
      needHScroll = apw - vsw < bw - 1
    }
    if (needHScroll && !needVScroll) {
      needVScroll = aph - hsh < bh - 1
    }
    if (needVScroll !== hasVScroll || needHScroll !== hasHScroll) {
      this._vScrollBar.setHidden(!needVScroll)
      this._hScrollBar.setHidden(!needHScroll)
      this._scrollCorner.setHidden(!needVScroll || !needHScroll)
      MessageLoop.sendMessage(this, Widget.Msg.FitRequest)
    }
    this._vScrollBar.maximum = this.maxScrollY
    this._vScrollBar.page = this.pageHeight
    this._hScrollBar.maximum = this.maxScrollX
    this._hScrollBar.page = this.pageWidth
    this._scrollTo(this._scrollX, this._scrollY)
  }
  private _syncViewport(): void {
    this.repaintContent()
    this.repaintOverlay()
    this._syncScrollState()
  }
  private _processViewportMessage(msg: Message): void {
    switch (msg.type) {
      case "resize":
        this._onViewportResize(msg as Widget.ResizeMessage)
        break
      case "scroll-request":
        this._onViewportScrollRequest(msg)
        break
      case "paint-request":
        this._onViewportPaintRequest(msg as Private.PaintRequest)
        break
      case "overlay-paint-request":
        this._onViewportOverlayPaintRequest(msg)
        break
      case "row-resize-request":
        this._onViewportRowResizeRequest(msg as Private.RowResizeRequest)
        break
      case "column-resize-request":
        this._onViewportColumnResizeRequest(msg as Private.ColumnResizeRequest)
        break
      default:
        break
    }
  }
  private _onViewportResize(msg: Widget.ResizeMessage): void {
    if (!this._viewport.isVisible) {
      return
    }
    let { width, height } = msg
    if (width === -1) {
      width = this._viewport.node.offsetWidth
    }
    if (height === -1) {
      height = this._viewport.node.offsetHeight
    }
    width = Math.round(width)
    height = Math.round(height)
    const oldWidth = this._viewportWidth
    const oldHeight = this._viewportHeight
    this._viewportWidth = width
    this._viewportHeight = height
    this._resizeCanvasIfNeeded(width, height)
    if (width === 0 || height === 0) {
      return
    }
    if (oldWidth === 0 || oldHeight === 0) {
      this.paintContent(0, 0, width, height)
      this._paintOverlay()
      return
    }
    if (this._stretchLastColumn && this.pageWidth > this.bodyWidth) {
      const bx = this._columnSections.offsetOf(this._columnSections.count - 1)
      const x = Math.min(this.headerWidth + bx, oldWidth)
      this.paintContent(x, 0, width - x, height)
    } else if (width > oldWidth) {
      this.paintContent(oldWidth, 0, width - oldWidth + 1, height)
    }
    if (this._stretchLastRow && this.pageHeight > this.bodyHeight) {
      const by = this._rowSections.offsetOf(this._rowSections.count - 1)
      const y = Math.min(this.headerHeight + by, oldHeight)
      this.paintContent(0, y, width, height - y)
    } else if (height > oldHeight) {
      this.paintContent(0, oldHeight, width, height - oldHeight + 1)
    }
    this._paintOverlay()
  }
  private _onViewportScrollRequest(msg: Message): void {
    this._scrollTo(this._hScrollBar.value, this._vScrollBar.value)
  }
  private _onViewportPaintRequest(msg: Private.PaintRequest): void {
    if (!this._viewport.isVisible) {
      return
    }
    if (this._viewportWidth === 0 || this._viewportHeight === 0) {
      return
    }
    const xMin = 0
    const yMin = 0
    const xMax = this._viewportWidth - 1
    const yMax = this._viewportHeight - 1
    const sx = this._scrollX
    const sy = this._scrollY
    const hw = this.headerWidth
    const hh = this.headerHeight
    const rs = this._rowSections
    const cs = this._columnSections
    const rhs = this._rowHeaderSections
    const chs = this._columnHeaderSections
    let { region, r1, c1, r2, c2 } = msg
    let x1: number
    let y1: number
    let x2: number
    let y2: number
    switch (region) {
      case "all":
        x1 = xMin
        y1 = yMin
        x2 = xMax
        y2 = yMax
        break
      case "body":
        r1 = Math.max(0, Math.min(r1, rs.count))
        c1 = Math.max(0, Math.min(c1, cs.count))
        r2 = Math.max(0, Math.min(r2, rs.count))
        c2 = Math.max(0, Math.min(c2, cs.count))
        x1 = cs.offsetOf(c1) - sx + hw
        y1 = rs.offsetOf(r1) - sy + hh
        x2 = cs.extentOf(c2) - sx + hw
        y2 = rs.extentOf(r2) - sy + hh
        break
      case "row-header":
        r1 = Math.max(0, Math.min(r1, rs.count))
        c1 = Math.max(0, Math.min(c1, rhs.count))
        r2 = Math.max(0, Math.min(r2, rs.count))
        c2 = Math.max(0, Math.min(c2, rhs.count))
        x1 = rhs.offsetOf(c1)
        y1 = rs.offsetOf(r1) - sy + hh
        x2 = rhs.extentOf(c2)
        y2 = rs.extentOf(r2) - sy + hh
        break
      case "column-header":
        r1 = Math.max(0, Math.min(r1, chs.count))
        c1 = Math.max(0, Math.min(c1, cs.count))
        r2 = Math.max(0, Math.min(r2, chs.count))
        c2 = Math.max(0, Math.min(c2, cs.count))
        x1 = cs.offsetOf(c1) - sx + hw
        y1 = chs.offsetOf(r1)
        x2 = cs.extentOf(c2) - sx + hw
        y2 = chs.extentOf(r2)
        break
      case "corner-header":
        r1 = Math.max(0, Math.min(r1, chs.count))
        c1 = Math.max(0, Math.min(c1, rhs.count))
        r2 = Math.max(0, Math.min(r2, chs.count))
        c2 = Math.max(0, Math.min(c2, rhs.count))
        x1 = rhs.offsetOf(c1)
        y1 = chs.offsetOf(r1)
        x2 = rhs.extentOf(c2)
        y2 = chs.extentOf(r2)
        break
      default:
        throw "unreachable"
    }
    if (x2 < xMin || y2 < yMin || x1 > xMax || y1 > yMax) {
      return
    }
    x1 = Math.max(xMin, Math.min(x1, xMax))
    y1 = Math.max(yMin, Math.min(y1, yMax))
    x2 = Math.max(xMin, Math.min(x2, xMax))
    y2 = Math.max(yMin, Math.min(y2, yMax))
    this.paintContent(x1, y1, x2 - x1 + 1, y2 - y1 + 1)
  }
  private _onViewportOverlayPaintRequest(msg: Message): void {
    if (!this._viewport.isVisible) {
      return
    }
    if (this._viewportWidth === 0 || this._viewportHeight === 0) {
      return
    }
    this._paintOverlay()
  }
  private _onViewportRowResizeRequest(msg: Private.RowResizeRequest): void {
    if (msg.region === "body") {
      this._resizeRow(msg.index, msg.size)
    } else {
      this._resizeColumnHeader(msg.index, msg.size)
    }
  }
  private _onViewportColumnResizeRequest(
    msg: Private.ColumnResizeRequest
  ): void {
    if (msg.region === "body") {
      this._resizeColumn(msg.index, msg.size)
    } else {
      this._resizeRowHeader(msg.index, msg.size)
    }
  }
  private _onThumbMoved(sender: ScrollBar): void {
    MessageLoop.postMessage(this._viewport, Private.ScrollRequest)
  }
  private _onPageRequested(
    sender: ScrollBar,
    dir: "decrement" | "increment"
  ): void {
    if (sender === this._vScrollBar) {
      this.scrollByPage(dir === "decrement" ? "up" : "down")
    } else {
      this.scrollByPage(dir === "decrement" ? "left" : "right")
    }
  }
  private _onStepRequested(
    sender: ScrollBar,
    dir: "decrement" | "increment"
  ): void {
    if (sender === this._vScrollBar) {
      this.scrollByStep(dir === "decrement" ? "up" : "down")
    } else {
      this.scrollByStep(dir === "decrement" ? "left" : "right")
    }
  }
  private _onDataModelChanged(
    sender: DataModel,
    args: DataModel.ChangedArgs
  ): void {
    switch (args.type) {
      case "rows-inserted":
        this._onRowsInserted(args)
        break
      case "columns-inserted":
        this._onColumnsInserted(args)
        break
      case "rows-removed":
        this._onRowsRemoved(args)
        break
      case "columns-removed":
        this._onColumnsRemoved(args)
        break
      case "rows-moved":
        this._onRowsMoved(args)
        break
      case "columns-moved":
        this._onColumnsMoved(args)
        break
      case "cells-changed":
        this._onCellsChanged(args)
        break
      case "model-reset":
        this._onModelReset(args)
        break
      default:
        throw "unreachable"
    }
  }
  private _onSelectionsChanged(sender: SelectionModel): void {
    this.repaintOverlay()
  }
  private _onRowsInserted(args: DataModel.RowsChangedArgs): void {
    const { region, index, span } = args
    if (span <= 0) {
      return
    }
    let list: SectionList
    if (region === "body") {
      list = this._rowSections
    } else {
      list = this._columnHeaderSections
    }
    if (this._scrollY === this.maxScrollY && this.maxScrollY > 0) {
      list.insert(index, span)
      this._scrollY = this.maxScrollY
    } else {
      list.insert(index, span)
    }
    this._syncViewport()
  }
  private _onColumnsInserted(args: DataModel.ColumnsChangedArgs): void {
    const { region, index, span } = args
    if (span <= 0) {
      return
    }
    let list: SectionList
    if (region === "body") {
      list = this._columnSections
    } else {
      list = this._rowHeaderSections
    }
    if (this._scrollX === this.maxScrollX && this.maxScrollX > 0) {
      list.insert(index, span)
      this._scrollX = this.maxScrollX
    } else {
      list.insert(index, span)
    }
    this._syncViewport()
  }
  private _onRowsRemoved(args: DataModel.RowsChangedArgs): void {
    const { region, index, span } = args
    if (span <= 0) {
      return
    }
    let list: SectionList
    if (region === "body") {
      list = this._rowSections
    } else {
      list = this._columnHeaderSections
    }
    if (index < 0 || index >= list.count) {
      return
    }
    if (this._scrollY === this.maxScrollY && this.maxScrollY > 0) {
      list.remove(index, span)
      this._scrollY = this.maxScrollY
    } else {
      list.remove(index, span)
    }
    this._syncViewport()
  }
  private _onColumnsRemoved(args: DataModel.ColumnsChangedArgs): void {
    const { region, index, span } = args
    if (span <= 0) {
      return
    }
    let list: SectionList
    if (region === "body") {
      list = this._columnSections
    } else {
      list = this._rowHeaderSections
    }
    if (index < 0 || index >= list.count) {
      return
    }
    if (this._scrollX === this.maxScrollX && this.maxScrollX > 0) {
      list.remove(index, span)
      this._scrollX = this.maxScrollX
    } else {
      list.remove(index, span)
    }
    this._syncViewport()
  }
  private _onRowsMoved(args: DataModel.RowsMovedArgs): void {
    let { region, index, span, destination } = args
    if (span <= 0) {
      return
    }
    let list: SectionList
    if (region === "body") {
      list = this._rowSections
    } else {
      list = this._columnHeaderSections
    }
    if (index < 0 || index >= list.count) {
      return
    }
    span = Math.min(span, list.count - index)
    destination = Math.min(Math.max(0, destination), list.count - span)
    if (index === destination) {
      return
    }
    const r1 = Math.min(index, destination)
    const r2 = Math.max(index + span - 1, destination + span - 1)
    list.move(index, span, destination)
    if (region === "body") {
      this.repaintRegion("body", r1, 0, r2, Infinity)
      this.repaintRegion("row-header", r1, 0, r2, Infinity)
    } else {
      this.repaintRegion("column-header", r1, 0, r2, Infinity)
      this.repaintRegion("corner-header", r1, 0, r2, Infinity)
    }
    this._syncViewport()
  }
  private _onColumnsMoved(args: DataModel.ColumnsMovedArgs): void {
    let { region, index, span, destination } = args
    if (span <= 0) {
      return
    }
    let list: SectionList
    if (region === "body") {
      list = this._columnSections
    } else {
      list = this._rowHeaderSections
    }
    if (index < 0 || index >= list.count) {
      return
    }
    span = Math.min(span, list.count - index)
    destination = Math.min(Math.max(0, destination), list.count - span)
    if (index === destination) {
      return
    }
    list.move(index, span, destination)
    const c1 = Math.min(index, destination)
    const c2 = Math.max(index + span - 1, destination + span - 1)
    if (region === "body") {
      this.repaintRegion("body", 0, c1, Infinity, c2)
      this.repaintRegion("column-header", 0, c1, Infinity, c2)
    } else {
      this.repaintRegion("row-header", 0, c1, Infinity, c2)
      this.repaintRegion("corner-header", 0, c1, Infinity, c2)
    }
    this._syncViewport()
  }
  private _onCellsChanged(args: DataModel.CellsChangedArgs): void {
    const { region, row, column, rowSpan, columnSpan } = args
    if (rowSpan <= 0 && columnSpan <= 0) {
      return
    }
    const r1 = row
    const c1 = column
    const r2 = r1 + rowSpan - 1
    const c2 = c1 + columnSpan - 1
    this.repaintRegion(region, r1, c1, r2, c2)
  }
  private _onModelReset(args: DataModel.ModelResetArgs): void {
    const nr = this._rowSections.count
    const nc = this._columnSections.count
    const nrh = this._rowHeaderSections.count
    const nch = this._columnHeaderSections.count
    const dr = this._dataModel!.rowCount("body") - nr
    const dc = this._dataModel!.columnCount("body") - nc
    const drh = this._dataModel!.columnCount("row-header") - nrh
    const dch = this._dataModel!.rowCount("column-header") - nch
    if (dr > 0) {
      this._rowSections.insert(nr, dr)
    } else if (dr < 0) {
      this._rowSections.remove(nr + dr, -dr)
    }
    if (dc > 0) {
      this._columnSections.insert(nc, dc)
    } else if (dc < 0) {
      this._columnSections.remove(nc + dc, -dc)
    }
    if (drh > 0) {
      this._rowHeaderSections.insert(nrh, drh)
    } else if (drh < 0) {
      this._rowHeaderSections.remove(nrh + drh, -drh)
    }
    if (dch > 0) {
      this._columnHeaderSections.insert(nch, dch)
    } else if (dch < 0) {
      this._columnHeaderSections.remove(nch + dch, -dch)
    }
    this._syncViewport()
  }
  private _onRenderersChanged(): void {
    this.repaintContent()
  }
  private _evtKeyDown(event: KeyboardEvent): void {
    if (this._mousedown) {
      event.preventDefault()
      event.stopPropagation()
    } else if (this._keyHandler) {
      this._keyHandler.onKeyDown(this, event)
    }
  }
  private _evtMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    this.activate()
    event.preventDefault()
    event.stopPropagation()
    document.addEventListener("keydown", this, true)
    document.addEventListener("mouseup", this, true)
    document.addEventListener("mousedown", this, true)
    document.addEventListener("mousemove", this, true)
    document.addEventListener("contextmenu", this, true)
    this._mousedown = true
    if (this._mouseHandler) {
      this._mouseHandler.onMouseDown(this, event)
    }
  }
  private _evtMouseMove(event: MouseEvent): void {
    if (this._mousedown) {
      event.preventDefault()
      event.stopPropagation()
    }
    if (!this._mouseHandler) {
      return
    }
    if (this._mousedown) {
      this._mouseHandler.onMouseMove(this, event)
    } else {
      this._mouseHandler.onMouseHover(this, event)
    }
  }
  private _evtMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (this._mouseHandler) {
      this._mouseHandler.onMouseUp(this, event)
    }
    this._releaseMouse()
  }
  private _evtMouseDoubleClick(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    if (this._mouseHandler) {
      this._mouseHandler.onMouseDoubleClick(this, event)
    }
    this._releaseMouse()
  }
  private _evtMouseLeave(event: MouseEvent): void {
    if (this._mousedown) {
      event.preventDefault()
      event.stopPropagation()
    } else if (this._mouseHandler) {
      this._mouseHandler.onMouseLeave(this, event)
    }
  }
  private _evtContextMenu(event: MouseEvent): void {
    if (this._mousedown) {
      event.preventDefault()
      event.stopPropagation()
    } else if (this._mouseHandler) {
      this._mouseHandler.onContextMenu(this, event)
    }
  }
  private _evtWheel(event: WheelEvent): void {
    if (Platform.accelKey(event)) {
      return
    }
    if (!this._mouseHandler) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this._mouseHandler.onWheel(this, event)
  }
  private _releaseMouse(): void {
    this._mousedown = false
    if (this._mouseHandler) {
      this._mouseHandler.release()
    }
    document.removeEventListener("keydown", this, true)
    document.removeEventListener("mouseup", this, true)
    document.removeEventListener("mousedown", this, true)
    document.removeEventListener("mousemove", this, true)
    document.removeEventListener("contextmenu", this, true)
  }
  private _refreshDPI(): void {
    const dpiRatio = Math.ceil(window.devicePixelRatio)
    if (this._dpiRatio === dpiRatio) {
      return
    }
    this._dpiRatio = dpiRatio
    this.repaintContent()
    this.repaintOverlay()
    this._resizeCanvasIfNeeded(this._viewportWidth, this._viewportHeight)
    this._canvas.style.width = `${this._canvas.width / this._dpiRatio}px`
    this._canvas.style.height = `${this._canvas.height / this._dpiRatio}px`
    this._overlay.style.width = `${this._overlay.width / this._dpiRatio}px`
    this._overlay.style.height = `${this._overlay.height / this._dpiRatio}px`
  }
  private _resizeRow(index: number, size: number): void {
    const list = this._rowSections
    if (index < 0 || index >= list.count) {
      return
    }
    const oldSize = list.sizeOf(index)
    const newSize = list.clampSize(size)
    if (oldSize === newSize) {
      return
    }
    list.resize(index, newSize)
    const vw = this._viewportWidth
    const vh = this._viewportHeight
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState()
      return
    }
    const paintEverything = Private.shouldPaintEverything(this._dataModel!)
    if (paintEverything) {
      this.paintContent(0, 0, vw, vh)
      this._paintOverlay()
      this._syncScrollState()
      return
    }
    const delta = newSize - oldSize
    const hh = this.headerHeight
    const offset = list.offsetOf(index) + hh - this._scrollY
    if (hh >= vh || offset >= vh) {
      this._syncScrollState()
      return
    }
    if (offset + oldSize <= hh) {
      this._scrollY += delta
      this._syncScrollState()
      return
    }
    const pos = Math.max(hh, offset)
    if (offset + oldSize >= vh || offset + newSize >= vh) {
      this.paintContent(0, pos, vw, vh - pos)
      this._paintOverlay()
      this._syncScrollState()
      return
    }
    const sx = 0
    const sw = vw
    const dx = 0
    let sy: number
    let sh: number
    let dy: number
    if (offset + newSize <= hh) {
      sy = hh - delta
      sh = vh - sy
      dy = hh
    } else {
      sy = offset + oldSize
      sh = vh - sy
      dy = sy + delta
    }
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy)
    if (newSize > 0 && offset + newSize > hh) {
      this.paintContent(0, pos, vw, offset + newSize - pos)
    }
    if (this._stretchLastRow && this.pageHeight > this.bodyHeight) {
      const r = this._rowSections.count - 1
      const y = hh + this._rowSections.offsetOf(r)
      this.paintContent(0, y, vw, vh - y)
    } else if (delta < 0) {
      this.paintContent(0, vh + delta, vw, -delta)
    }
    this._paintOverlay()
    this._syncScrollState()
  }
  private _resizeColumn(index: number, size: number): void {
    const list = this._columnSections
    if (index < 0 || index >= list.count) {
      return
    }
    const oldSize = list.sizeOf(index)
    const newSize = list.clampSize(size)
    if (oldSize === newSize) {
      return
    }
    list.resize(index, newSize)
    const vw = this._viewportWidth
    const vh = this._viewportHeight
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState()
      return
    }
    const paintEverything = Private.shouldPaintEverything(this._dataModel!)
    if (paintEverything) {
      this.paintContent(0, 0, vw, vh)
      this._paintOverlay()
      this._syncScrollState()
      return
    }
    const delta = newSize - oldSize
    const hw = this.headerWidth
    const offset = list.offsetOf(index) + hw - this._scrollX
    if (hw >= vw || offset >= vw) {
      this._syncScrollState()
      return
    }
    if (offset + oldSize <= hw) {
      this._scrollX += delta
      this._syncScrollState()
      return
    }
    const pos = Math.max(hw, offset)
    if (offset + oldSize >= vw || offset + newSize >= vw) {
      this.paintContent(pos, 0, vw - pos, vh)
      this._paintOverlay()
      this._syncScrollState()
      return
    }
    const sy = 0
    const sh = vh
    const dy = 0
    let sx: number
    let sw: number
    let dx: number
    if (offset + newSize <= hw) {
      sx = hw - delta
      sw = vw - sx
      dx = hw
    } else {
      sx = offset + oldSize
      sw = vw - sx
      dx = sx + delta
    }
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy)
    if (newSize > 0 && offset + newSize > hw) {
      this.paintContent(pos, 0, offset + newSize - pos, vh)
    }
    if (this._stretchLastColumn && this.pageWidth > this.bodyWidth) {
      const c = this._columnSections.count - 1
      const x = hw + this._columnSections.offsetOf(c)
      this.paintContent(x, 0, vw - x, vh)
    } else if (delta < 0) {
      this.paintContent(vw + delta, 0, -delta, vh)
    }
    this._paintOverlay()
    this._syncScrollState()
  }
  private _resizeRowHeader(index: number, size: number): void {
    const list = this._rowHeaderSections
    if (index < 0 || index >= list.count) {
      return
    }
    const oldSize = list.sizeOf(index)
    const newSize = list.clampSize(size)
    if (oldSize === newSize) {
      return
    }
    list.resize(index, newSize)
    const vw = this._viewportWidth
    const vh = this._viewportHeight
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState()
      return
    }
    const paintEverything = Private.shouldPaintEverything(this._dataModel!)
    if (paintEverything) {
      this.paintContent(0, 0, vw, vh)
      this._paintOverlay()
      this._syncScrollState()
      return
    }
    const delta = newSize - oldSize
    const offset = list.offsetOf(index)
    if (offset >= vw) {
      this._syncScrollState()
      return
    }
    if (offset + oldSize >= vw || offset + newSize >= vw) {
      this.paintContent(offset, 0, vw - offset, vh)
      this._paintOverlay()
      this._syncScrollState()
      return
    }
    const sx = offset + oldSize
    const sy = 0
    const sw = vw - sx
    const sh = vh
    const dx = sx + delta
    const dy = 0
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy)
    if (newSize > 0) {
      this.paintContent(offset, 0, newSize, vh)
    }
    if (this._stretchLastColumn && this.pageWidth > this.bodyWidth) {
      const c = this._columnSections.count - 1
      const x = this.headerWidth + this._columnSections.offsetOf(c)
      this.paintContent(x, 0, vw - x, vh)
    } else if (delta < 0) {
      this.paintContent(vw + delta, 0, -delta + 1, vh)
    }
    this._paintOverlay()
    this._syncScrollState()
  }
  private _resizeColumnHeader(index: number, size: number): void {
    const list = this._columnHeaderSections
    if (index < 0 || index >= list.count) {
      return
    }
    const oldSize = list.sizeOf(index)
    const newSize = list.clampSize(size)
    if (oldSize === newSize) {
      return
    }
    list.resize(index, newSize)
    const vw = this._viewportWidth
    const vh = this._viewportHeight
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState()
      return
    }
    const paintEverything = Private.shouldPaintEverything(this._dataModel!)
    if (paintEverything) {
      this.paintContent(0, 0, vw, vh)
      this._paintOverlay()
      this._syncScrollState()
      return
    }
    this._paintOverlay()
    const delta = newSize - oldSize
    const offset = list.offsetOf(index)
    if (offset >= vh) {
      this._syncScrollState()
      return
    }
    if (offset + oldSize >= vh || offset + newSize >= vh) {
      this.paintContent(0, offset, vw, vh - offset)
      this._paintOverlay()
      this._syncScrollState()
      return
    }
    const sx = 0
    const sy = offset + oldSize
    const sw = vw
    const sh = vh - sy
    const dx = 0
    const dy = sy + delta
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy)
    if (newSize > 0) {
      this.paintContent(0, offset, vw, newSize)
    }
    if (this._stretchLastRow && this.pageHeight > this.bodyHeight) {
      const r = this._rowSections.count - 1
      const y = this.headerHeight + this._rowSections.offsetOf(r)
      this.paintContent(0, y, vw, vh - y)
    } else if (delta < 0) {
      this.paintContent(0, vh + delta, vw, -delta + 1)
    }
    this._paintOverlay()
    this._syncScrollState()
  }
  private _scrollTo(x: number, y: number): void {
    if (!this.dataModel) {
      return
    }
    x = Math.max(0, Math.min(Math.floor(x), this.maxScrollX))
    y = Math.max(0, Math.min(Math.floor(y), this.maxScrollY))
    this._hScrollBar.value = x
    this._vScrollBar.value = y
    const dx = x - this._scrollX
    const dy = y - this._scrollY
    if (dx === 0 && dy === 0) {
      return
    }
    if (!this._viewport.isVisible) {
      this._scrollX = x
      this._scrollY = y
      return
    }
    const width = this._viewportWidth
    const height = this._viewportHeight
    if (width === 0 || height === 0) {
      this._scrollX = x
      this._scrollY = y
      return
    }
    const contentX = this.headerWidth
    const contentY = this.headerHeight
    const contentWidth = width - contentX
    const contentHeight = height - contentY
    if (contentWidth <= 0 && contentHeight <= 0) {
      this._scrollX = x
      this._scrollY = y
      return
    }
    let dxArea = 0
    if (dx !== 0 && contentWidth > 0) {
      if (Math.abs(dx) >= contentWidth) {
        dxArea = contentWidth * height
      } else {
        dxArea = Math.abs(dx) * height
      }
    }
    let dyArea = 0
    if (dy !== 0 && contentHeight > 0) {
      if (Math.abs(dy) >= contentHeight) {
        dyArea = width * contentHeight
      } else {
        dyArea = width * Math.abs(dy)
      }
    }
    if (dxArea + dyArea >= width * height) {
      this._scrollX = x
      this._scrollY = y
      this.paintContent(0, 0, width, height)
      this._paintOverlay()
      return
    }
    this._scrollY = y
    if (dy !== 0 && contentHeight > 0) {
      if (Math.abs(dy) >= contentHeight) {
        this.paintContent(0, contentY, width, contentHeight)
      } else {
        const x = 0
        const y = dy < 0 ? contentY : contentY + dy
        const w = width
        const h = contentHeight - Math.abs(dy)
        this._blitContent(this._canvas, x, y, w, h, x, y - dy)
        this.paintContent(
          0,
          dy < 0 ? contentY : height - dy,
          width,
          Math.abs(dy)
        )
      }
    }
    this._scrollX = x
    if (dx !== 0 && contentWidth > 0) {
      if (Math.abs(dx) >= contentWidth) {
        this.paintContent(contentX, 0, contentWidth, height)
      } else {
        const x = dx < 0 ? contentX : contentX + dx
        const y = 0
        const w = contentWidth - Math.abs(dx)
        const h = height
        this._blitContent(this._canvas, x, y, w, h, x - dx, y)
        this.paintContent(
          dx < 0 ? contentX : width - dx,
          0,
          Math.abs(dx),
          height
        )
      }
    }
    this._paintOverlay()
  }
  private _blitContent(
    source: HTMLCanvasElement,
    x: number,
    y: number,
    w: number,
    h: number,
    dx: number,
    dy: number
  ): void {
    x *= this._dpiRatio
    y *= this._dpiRatio
    w *= this._dpiRatio
    h *= this._dpiRatio
    dx *= this._dpiRatio
    dy *= this._dpiRatio
    this._canvasGC.save()
    this._canvasGC.setTransform(1, 0, 0, 1, 0, 0)
    this._canvasGC.drawImage(source, x, y, w, h, dx, dy, w, h)
    this._canvasGC.restore()
  }
  protected paintContent(rx: number, ry: number, rw: number, rh: number): void {
    this._canvasGC.setTransform(this._dpiRatio, 0, 0, this._dpiRatio, 0, 0)
    this._bufferGC.setTransform(this._dpiRatio, 0, 0, this._dpiRatio, 0, 0)
    this._canvasGC.clearRect(rx, ry, rw, rh)
    this._drawVoidRegion(rx, ry, rw, rh)
    this._drawBodyRegion(rx, ry, rw, rh)
    this._drawRowHeaderRegion(rx, ry, rw, rh)
    this._drawColumnHeaderRegion(rx, ry, rw, rh)
    this.drawCornerHeaderRegion(rx, ry, rw, rh)
  }
  private _fitBodyColumnHeaders(
    dataModel: DataModel,
    padding: number,
    numCols?: number
  ): void {
    const bodyColumnCount =
      numCols === undefined ? dataModel.columnCount("body") : numCols
    for (let i = 0; i < bodyColumnCount; i++) {
      const numRows = dataModel.rowCount("column-header")
      let maxWidth = 0
      for (let j = 0; j < numRows; j++) {
        const cellValue = dataModel.data("column-header", j, i)
        const config = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          region: "column-header" as DataModel.CellRegion,
          row: 0,
          column: i,
          value: null as any,
          metadata: DataModel.emptyMetadata,
        }
        const renderer = this.cellRenderers.get(config) as TextRenderer
        const gc = this.canvasGC
        gc.font = CellRenderer.resolveOption(renderer.font, config)
        const textWidth = gc.measureText(cellValue).width
        maxWidth = Math.max(maxWidth, textWidth)
      }
      this.resizeColumn("body", i, maxWidth + padding)
    }
  }
  private _fitRowColumnHeaders(
    dataModel: DataModel,
    padding: number,
    numCols?: number
  ): void {
    const rowColumnCount =
      numCols === undefined ? dataModel.columnCount("row-header") : numCols
    for (let i = 0; i < rowColumnCount; i++) {
      const numCols = dataModel.rowCount("column-header")
      let maxWidth = 0
      for (let j = 0; j < numCols; j++) {
        const cellValue = dataModel.data("corner-header", j, i)
        const config = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          region: "column-header" as DataModel.CellRegion,
          row: 0,
          column: i,
          value: null as any,
          metadata: DataModel.emptyMetadata,
        }
        const renderer = this.cellRenderers.get(config) as TextRenderer
        const gc = this.canvasGC
        gc.font = CellRenderer.resolveOption(renderer.font, config)
        const textWidth = gc.measureText(cellValue).width
        maxWidth = Math.max(maxWidth, textWidth)
      }
      this.resizeColumn("row-header", i, maxWidth + padding)
    }
  }
  private _paintOverlay(): void {
    this._overlayGC.setTransform(this._dpiRatio, 0, 0, this._dpiRatio, 0, 0)
    this._overlayGC.clearRect(0, 0, this._overlay.width, this._overlay.height)
    this._drawBodySelections()
    this._drawRowHeaderSelections()
    this._drawColumnHeaderSelections()
    this._drawCursor()
    this._drawShadows()
  }
  private _drawVoidRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    const color = this._style.voidColor
    if (!color) {
      return
    }
    this._canvasGC.fillStyle = color
    this._canvasGC.fillRect(rx, ry, rw, rh)
  }
  private _drawBodyRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    const contentW = this._columnSections.length - this._scrollX
    const contentH = this._rowSections.length - this._scrollY
    if (contentW <= 0 || contentH <= 0) {
      return
    }
    const contentX = this.headerWidth
    const contentY = this.headerHeight
    if (rx + rw <= contentX) {
      return
    }
    if (ry + rh <= contentY) {
      return
    }
    if (rx >= contentX + contentW) {
      return
    }
    if (ry >= contentY + contentH) {
      return
    }
    const bh = this.bodyHeight
    const bw = this.bodyWidth
    const ph = this.pageHeight
    const pw = this.pageWidth
    const x1 = Math.max(rx, contentX)
    const y1 = Math.max(ry, contentY)
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1)
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1)
    const r1 = this._rowSections.indexOf(y1 - contentY + this._scrollY)
    const c1 = this._columnSections.indexOf(x1 - contentX + this._scrollX)
    let r2 = this._rowSections.indexOf(y2 - contentY + this._scrollY)
    let c2 = this._columnSections.indexOf(x2 - contentX + this._scrollX)
    const maxRow = this._rowSections.count - 1
    const maxColumn = this._columnSections.count - 1
    if (r2 < 0) {
      r2 = maxRow
    }
    if (c2 < 0) {
      c2 = maxColumn
    }
    const x = this._columnSections.offsetOf(c1) + contentX - this._scrollX
    const y = this._rowSections.offsetOf(r1) + contentY - this._scrollY
    let width = 0
    let height = 0
    const rowSizes = new Array<number>(r2 - r1 + 1)
    const columnSizes = new Array<number>(c2 - c1 + 1)
    for (let j = r1; j <= r2; ++j) {
      const size = this._rowSections.sizeOf(j)
      rowSizes[j - r1] = size
      height += size
    }
    for (let i = c1; i <= c2; ++i) {
      const size = this._columnSections.sizeOf(i)
      columnSizes[i - c1] = size
      width += size
    }
    if (this._stretchLastRow && ph > bh && r2 === maxRow) {
      const dh = this.pageHeight - this.bodyHeight
      rowSizes[rowSizes.length - 1] += dh
      height += dh
      y2 += dh
    }
    if (this._stretchLastColumn && pw > bw && c2 === maxColumn) {
      const dw = this.pageWidth - this.bodyWidth
      columnSizes[columnSizes.length - 1] += dw
      width += dw
      x2 += dw
    }
    const rgn: Private.PaintRegion = {
      region: "body",
      xMin: x1,
      yMin: y1,
      xMax: x2,
      yMax: y2,
      x,
      y,
      width,
      height,
      row: r1,
      column: c1,
      rowSizes,
      columnSizes,
    }
    this._drawBackground(rgn, this._style.backgroundColor)
    this._drawRowBackground(rgn, this._style.rowBackgroundColor)
    this._drawColumnBackground(rgn, this._style.columnBackgroundColor)
    this._drawCells(rgn)
    this._drawHorizontalGridLines(
      rgn,
      this._style.horizontalGridLineColor || this._style.gridLineColor
    )
    this._drawVerticalGridLines(
      rgn,
      this._style.verticalGridLineColor || this._style.gridLineColor
    )
  }
  private _drawRowHeaderRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    const contentW = this.headerWidth
    const contentH = this.bodyHeight - this._scrollY
    if (contentW <= 0 || contentH <= 0) {
      return
    }
    const contentX = 0
    const contentY = this.headerHeight
    if (rx + rw <= contentX) {
      return
    }
    if (ry + rh <= contentY) {
      return
    }
    if (rx >= contentX + contentW) {
      return
    }
    if (ry >= contentY + contentH) {
      return
    }
    const bh = this.bodyHeight
    const ph = this.pageHeight
    const x1 = rx
    const y1 = Math.max(ry, contentY)
    const x2 = Math.min(rx + rw - 1, contentX + contentW - 1)
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1)
    const r1 = this._rowSections.indexOf(y1 - contentY + this._scrollY)
    const c1 = this._rowHeaderSections.indexOf(x1)
    let r2 = this._rowSections.indexOf(y2 - contentY + this._scrollY)
    let c2 = this._rowHeaderSections.indexOf(x2)
    const maxRow = this._rowSections.count - 1
    const maxColumn = this._rowHeaderSections.count - 1
    if (r2 < 0) {
      r2 = maxRow
    }
    if (c2 < 0) {
      c2 = maxColumn
    }
    const x = this._rowHeaderSections.offsetOf(c1)
    const y = this._rowSections.offsetOf(r1) + contentY - this._scrollY
    let width = 0
    let height = 0
    const rowSizes = new Array<number>(r2 - r1 + 1)
    const columnSizes = new Array<number>(c2 - c1 + 1)
    for (let j = r1; j <= r2; ++j) {
      const size = this._rowSections.sizeOf(j)
      rowSizes[j - r1] = size
      height += size
    }
    for (let i = c1; i <= c2; ++i) {
      const size = this._rowHeaderSections.sizeOf(i)
      columnSizes[i - c1] = size
      width += size
    }
    if (this._stretchLastRow && ph > bh && r2 === maxRow) {
      const dh = this.pageHeight - this.bodyHeight
      rowSizes[rowSizes.length - 1] += dh
      height += dh
      y2 += dh
    }
    const rgn: Private.PaintRegion = {
      region: "row-header",
      xMin: x1,
      yMin: y1,
      xMax: x2,
      yMax: y2,
      x,
      y,
      width,
      height,
      row: r1,
      column: c1,
      rowSizes,
      columnSizes,
    }
    this._drawBackground(rgn, this._style.headerBackgroundColor)
    this._drawCells(rgn)
    this._drawHorizontalGridLines(
      rgn,
      this._style.headerHorizontalGridLineColor ||
        this._style.headerGridLineColor
    )
    this._drawVerticalGridLines(
      rgn,
      this._style.headerVerticalGridLineColor || this._style.headerGridLineColor
    )
  }
  private _drawColumnHeaderRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    const contentW = this.bodyWidth - this._scrollX
    const contentH = this.headerHeight
    if (contentW <= 0 || contentH <= 0) {
      return
    }
    const contentX = this.headerWidth
    const contentY = 0
    if (rx + rw <= contentX) {
      return
    }
    if (ry + rh <= contentY) {
      return
    }
    if (rx >= contentX + contentW) {
      return
    }
    if (ry >= contentY + contentH) {
      return
    }
    const bw = this.bodyWidth
    const pw = this.pageWidth
    const x1 = Math.max(rx, contentX)
    const y1 = ry
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1)
    const y2 = Math.min(ry + rh - 1, contentY + contentH - 1)
    const r1 = this._columnHeaderSections.indexOf(y1)
    const c1 = this._columnSections.indexOf(x1 - contentX + this._scrollX)
    let r2 = this._columnHeaderSections.indexOf(y2)
    let c2 = this._columnSections.indexOf(x2 - contentX + this._scrollX)
    const maxRow = this._columnHeaderSections.count - 1
    const maxColumn = this._columnSections.count - 1
    if (r2 < 0) {
      r2 = maxRow
    }
    if (c2 < 0) {
      c2 = maxColumn
    }
    const x = this._columnSections.offsetOf(c1) + contentX - this._scrollX
    const y = this._columnHeaderSections.offsetOf(r1)
    let width = 0
    let height = 0
    const rowSizes = new Array<number>(r2 - r1 + 1)
    const columnSizes = new Array<number>(c2 - c1 + 1)
    for (let j = r1; j <= r2; ++j) {
      const size = this._columnHeaderSections.sizeOf(j)
      rowSizes[j - r1] = size
      height += size
    }
    for (let i = c1; i <= c2; ++i) {
      const size = this._columnSections.sizeOf(i)
      columnSizes[i - c1] = size
      width += size
    }
    if (this._stretchLastColumn && pw > bw && c2 === maxColumn) {
      const dw = this.pageWidth - this.bodyWidth
      columnSizes[columnSizes.length - 1] += dw
      width += dw
      x2 += dw
    }
    const rgn: Private.PaintRegion = {
      region: "column-header",
      xMin: x1,
      yMin: y1,
      xMax: x2,
      yMax: y2,
      x,
      y,
      width,
      height,
      row: r1,
      column: c1,
      rowSizes,
      columnSizes,
    }
    this._drawBackground(rgn, this._style.headerBackgroundColor)
    this._drawCells(rgn)
    this._drawHorizontalGridLines(
      rgn,
      this._style.headerHorizontalGridLineColor ||
        this._style.headerGridLineColor
    )
    this._drawVerticalGridLines(
      rgn,
      this._style.headerVerticalGridLineColor || this._style.headerGridLineColor
    )
  }
  protected drawCornerHeaderRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    const contentW = this.headerWidth
    const contentH = this.headerHeight
    if (contentW <= 0 || contentH <= 0) {
      return
    }
    const contentX = 0
    const contentY = 0
    if (rx + rw <= contentX) {
      return
    }
    if (ry + rh <= contentY) {
      return
    }
    if (rx >= contentX + contentW) {
      return
    }
    if (ry >= contentY + contentH) {
      return
    }
    const x1 = rx
    const y1 = ry
    const x2 = Math.min(rx + rw - 1, contentX + contentW - 1)
    const y2 = Math.min(ry + rh - 1, contentY + contentH - 1)
    const r1 = this._columnHeaderSections.indexOf(y1)
    const c1 = this._rowHeaderSections.indexOf(x1)
    let r2 = this._columnHeaderSections.indexOf(y2)
    let c2 = this._rowHeaderSections.indexOf(x2)
    if (r2 < 0) {
      r2 = this._columnHeaderSections.count - 1
    }
    if (c2 < 0) {
      c2 = this._rowHeaderSections.count - 1
    }
    const x = this._rowHeaderSections.offsetOf(c1)
    const y = this._columnHeaderSections.offsetOf(r1)
    let width = 0
    let height = 0
    const rowSizes = new Array<number>(r2 - r1 + 1)
    const columnSizes = new Array<number>(c2 - c1 + 1)
    for (let j = r1; j <= r2; ++j) {
      const size = this._columnHeaderSections.sizeOf(j)
      rowSizes[j - r1] = size
      height += size
    }
    for (let i = c1; i <= c2; ++i) {
      const size = this._rowHeaderSections.sizeOf(i)
      columnSizes[i - c1] = size
      width += size
    }
    const rgn: Private.PaintRegion = {
      region: "corner-header",
      xMin: x1,
      yMin: y1,
      xMax: x2,
      yMax: y2,
      x,
      y,
      width,
      height,
      row: r1,
      column: c1,
      rowSizes,
      columnSizes,
    }
    this._drawBackground(rgn, this._style.headerBackgroundColor)
    this._drawCells(rgn)
    this._drawHorizontalGridLines(
      rgn,
      this._style.headerHorizontalGridLineColor ||
        this._style.headerGridLineColor
    )
    this._drawVerticalGridLines(
      rgn,
      this._style.headerVerticalGridLineColor || this._style.headerGridLineColor
    )
  }
  private _drawBackground(
    rgn: Private.PaintRegion,
    color: string | undefined
  ): void {
    if (!color) {
      return
    }
    const { xMin, yMin, xMax, yMax } = rgn
    this._canvasGC.fillStyle = color
    this._canvasGC.fillRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1)
  }
  private _drawRowBackground(
    rgn: Private.PaintRegion,
    colorFn: ((i: number) => string) | undefined
  ): void {
    if (!colorFn) {
      return
    }
    const x1 = Math.max(rgn.xMin, rgn.x)
    const x2 = Math.min(rgn.x + rgn.width - 1, rgn.xMax)
    for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
      const size = rgn.rowSizes[j]
      if (size === 0) {
        continue
      }
      const color = colorFn(rgn.row + j)
      if (color) {
        const y1 = Math.max(rgn.yMin, y)
        const y2 = Math.min(y + size - 1, rgn.yMax)
        this._canvasGC.fillStyle = color
        this._canvasGC.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1)
      }
      y += size
    }
  }
  private _drawColumnBackground(
    rgn: Private.PaintRegion,
    colorFn: ((i: number) => string) | undefined
  ): void {
    if (!colorFn) {
      return
    }
    const y1 = Math.max(rgn.yMin, rgn.y)
    const y2 = Math.min(rgn.y + rgn.height - 1, rgn.yMax)
    for (let x = rgn.x, i = 0, n = rgn.columnSizes.length; i < n; ++i) {
      const size = rgn.columnSizes[i]
      if (size === 0) {
        continue
      }
      const color = colorFn(rgn.column + i)
      if (color) {
        const x1 = Math.max(rgn.xMin, x)
        const x2 = Math.min(x + size - 1, rgn.xMax)
        this._canvasGC.fillStyle = color
        this._canvasGC.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1)
      }
      x += size
    }
  }
  private _getColumnSize(region: DataModel.CellRegion, index: number): number {
    if (region === "corner-header") {
      return this._rowHeaderSections.sizeOf(index)
    }
    return this.columnSize(region as DataModel.ColumnRegion, index)
  }
  private _getRowSize(region: DataModel.CellRegion, index: number): number {
    if (region === "corner-header") {
      return this._columnHeaderSections.sizeOf(index)
    }
    return this.rowSize(region as DataModel.RowRegion, index)
  }
  private _drawCells(rgn: Private.PaintRegion): void {
    if (!this._dataModel) {
      return
    }
    const intersectingColumnGroups = CellGroup.getCellGroupsAtColumn(
      this._dataModel!,
      rgn.region,
      rgn.column
    )
    const intersectingRowGroups = CellGroup.getCellGroupsAtRow(
      this._dataModel!,
      rgn.region,
      rgn.row
    )
    rgn = JSONExt.deepCopy(rgn)
    const joinedGroup = CellGroup.joinCellGroupWithMergedCellGroups(
      this.dataModel!,
      {
        r1: rgn.row,
        r2: rgn.row + rgn.rowSizes.length - 1,
        c1: rgn.column,
        c2: rgn.column + rgn.columnSizes.length - 1,
      },
      rgn.region
    )
    for (let r = joinedGroup.r1; r < rgn.row; r++) {
      const h = this._getRowSize(rgn.region, r)
      rgn.y -= h
      rgn.rowSizes = [h].concat(rgn.rowSizes)
    }
    rgn.row = joinedGroup.r1
    for (let c = joinedGroup.c1; c < rgn.column; c++) {
      const w = this._getColumnSize(rgn.region, c)
      rgn.x -= w
      rgn.columnSizes = [w].concat(rgn.columnSizes)
    }
    rgn.column = joinedGroup.c1
    const config = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      region: rgn.region,
      row: 0,
      column: 0,
      value: null as any,
      metadata: DataModel.emptyMetadata,
    }
    let groupIndex = -1
    this._bufferGC.save()
    const gc = new GraphicsContext(this._bufferGC)
    let height = 0
    for (let x = rgn.x, i = 0, n = rgn.columnSizes.length; i < n; ++i) {
      let xOffset = 0
      let yOffset = 0
      let width = rgn.columnSizes[i]
      if (width === 0) {
        continue
      }
      xOffset = width
      const column = rgn.column + i
      config.x = x
      config.width = width
      config.column = column
      for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
        height = rgn.rowSizes[j]
        if (height === 0) {
          continue
        }
        const row = rgn.row + j
        groupIndex = CellGroup.getGroupIndex(
          this.dataModel!,
          config.region,
          row,
          column
        )
        yOffset = height
        if (groupIndex !== -1) {
          const group = this.dataModel!.group(config.region, groupIndex)!
          if (group.r1 === row && group.c1 === column) {
            width = 0
            for (let c = group.c1; c <= group.c2; c++) {
              width += this._getColumnSize(config.region, c)
            }
            height = 0
            for (let r = group.r1; r <= group.r2; r++) {
              height += this._getRowSize(config.region, r)
            }
          } else {
            y += yOffset
            continue
          }
        } else {
          if (rgn.region == "column-header") {
            width = rgn.columnSizes[i]
          }
        }
        gc.clearRect(x, y, width, height)
        gc.save()
        let value: any
        try {
          value = this._dataModel.data(rgn.region, row, column)
        } catch (err) {
          value = undefined
          console.error(err)
        }
        let metadata: DataModel.Metadata
        try {
          metadata = this._dataModel.metadata(rgn.region, row, column)
        } catch (err) {
          metadata = DataModel.emptyMetadata
          console.error(err)
        }
        config.y = y
        config.height = height
        config.width = width
        config.row = row
        config.value = value
        config.metadata = metadata
        const renderer = this._cellRenderers.get(config)
        gc.save()
        try {
          renderer.paint(gc, config)
        } catch (err) {
          console.error(err)
        }
        gc.restore()
        const x1 = Math.max(rgn.xMin, config.x)
        const x2 = Math.min(config.x + config.width - 1, rgn.xMax)
        const y1 = Math.max(rgn.yMin, config.y)
        const y2 = Math.min(config.y + config.height - 1, rgn.yMax)
        if (
          intersectingColumnGroups.length !== 0 ||
          intersectingRowGroups.length !== 0
        ) {
          if (x2 > x1 && y2 > y1) {
            this._blitContent(
              this._buffer,
              x1,
              y1,
              x2 - x1 + 1,
              y2 - y1 + 1,
              x1,
              y1
            )
          }
        } else {
          this._blitContent(
            this._buffer,
            x1,
            y1,
            x2 - x1 + 1,
            y2 - y1 + 1,
            x1,
            y1
          )
        }
        y += yOffset
      }
      gc.restore()
      x += xOffset
    }
    gc.dispose()
    this._bufferGC.restore()
  }
  private _drawHorizontalGridLines(
    rgn: Private.PaintRegion,
    color: string | undefined
  ): void {
    if (!color) {
      return
    }
    const x1 = Math.max(rgn.xMin, rgn.x)
    this._canvasGC.beginPath()
    this._canvasGC.lineWidth = 1
    const bh = this.bodyHeight
    const ph = this.pageHeight
    let n = rgn.rowSizes.length
    if (this._stretchLastRow && ph > bh) {
      if (rgn.row + n === this._rowSections.count) {
        n -= 1
      }
    }
    for (let y = rgn.y, j = 0; j < n; ++j) {
      const size = rgn.rowSizes[j]
      if (size === 0) {
        continue
      }
      let xStart = 0
      let lineStarted = false
      const lines = []
      let leftCurrent = x1
      for (let c = rgn.column; c < rgn.column + rgn.columnSizes.length; c++) {
        const cIndex = c - rgn.column
        const cellUp = [rgn.row + j, c]
        const cellDown = [rgn.row + j + 1, c]
        if (
          CellGroup.areCellsMerged(
            this.dataModel!,
            rgn.region,
            cellUp,
            cellDown
          )
        ) {
          if (lineStarted) {
            lines.push([xStart, leftCurrent])
          }
          lineStarted = false
        } else {
          if (!lineStarted) {
            lineStarted = true
            xStart = leftCurrent
          }
        }
        leftCurrent += rgn.columnSizes[cIndex]
        if (c === rgn.column) {
          leftCurrent -= rgn.xMin - rgn.x
        }
      }
      if (lineStarted) {
        lines.push([xStart, rgn.xMax + 1])
      }
      const pos = y + size - 1
      if (pos >= rgn.yMin && pos <= rgn.yMax) {
        const extendLines = Private.shouldPaintEverything(this._dataModel!)
        if (extendLines) {
          for (const line of lines) {
            const [x1, x2] = line
            this._canvasGC.moveTo(x1, pos + 0.5)
            this._canvasGC.lineTo(x2, pos + 0.5)
          }
        } else {
          const x2 = Math.min(rgn.x + rgn.width, rgn.xMax + 1)
          this._canvasGC.moveTo(x1, pos + 0.5)
          this._canvasGC.lineTo(x2, pos + 0.5)
        }
      }
      y += size
    }
    this._canvasGC.strokeStyle = color
    this._canvasGC.stroke()
  }
  private _drawVerticalGridLines(
    rgn: Private.PaintRegion,
    color: string | undefined
  ): void {
    if (!color) {
      return
    }
    const y1 = Math.max(rgn.yMin, rgn.y)
    this._canvasGC.beginPath()
    this._canvasGC.lineWidth = 1
    const bw = this.bodyWidth
    const pw = this.pageWidth
    let n = rgn.columnSizes.length
    if (this._stretchLastColumn && pw > bw) {
      if (rgn.column + n === this._columnSections.count) {
        n -= 1
      }
    }
    for (let x = rgn.x, i = 0; i < n; ++i) {
      const size = rgn.columnSizes[i]
      if (size === 0) {
        continue
      }
      let yStart = 0
      let lineStarted = false
      const lines = []
      let topCurrent = y1
      for (let r = rgn.row; r < rgn.row + rgn.rowSizes.length; r++) {
        const rIndex = r - rgn.row
        const cellLeft = [r, rgn.column + i]
        const cellRight = [r, rgn.column + i + 1]
        if (
          CellGroup.areCellsMerged(
            this.dataModel!,
            rgn.region,
            cellLeft,
            cellRight
          )
        ) {
          if (lineStarted) {
            lines.push([yStart, topCurrent])
          }
          lineStarted = false
        } else {
          if (!lineStarted) {
            lineStarted = true
            yStart = topCurrent
          }
        }
        topCurrent += rgn.rowSizes[rIndex]
        if (r === rgn.row) {
          topCurrent -= rgn.yMin - rgn.y
        }
      }
      if (lineStarted) {
        lines.push([yStart, rgn.yMax + 1])
      }
      const pos = x + size - 1
      if (pos >= rgn.xMin && pos <= rgn.xMax) {
        const extendLines = Private.shouldPaintEverything(this._dataModel!)
        if (extendLines) {
          for (const line of lines) {
            this._canvasGC.moveTo(pos + 0.5, line[0])
            this._canvasGC.lineTo(pos + 0.5, line[1])
          }
        } else {
          const y2 = Math.min(rgn.y + rgn.height, rgn.yMax + 1)
          this._canvasGC.moveTo(pos + 0.5, y1)
          this._canvasGC.lineTo(pos + 0.5, y2)
        }
      }
      x += size
    }
    this._canvasGC.strokeStyle = color
    this._canvasGC.stroke()
  }
  private _drawBodySelections(): void {
    const model = this._selectionModel
    if (!model || model.isEmpty) {
      return
    }
    const fill = this._style.selectionFillColor
    const stroke = this._style.selectionBorderColor
    if (!fill && !stroke) {
      return
    }
    const sx = this._scrollX
    const sy = this._scrollY
    const r1 = this._rowSections.indexOf(sy)
    const c1 = this._columnSections.indexOf(sx)
    if (r1 < 0 || c1 < 0) {
      return
    }
    const bw = this.bodyWidth
    const bh = this.bodyHeight
    const pw = this.pageWidth
    const ph = this.pageHeight
    const hw = this.headerWidth
    const hh = this.headerHeight
    let r2 = this._rowSections.indexOf(sy + ph)
    let c2 = this._columnSections.indexOf(sx + pw)
    const maxRow = this._rowSections.count - 1
    const maxColumn = this._columnSections.count - 1
    r2 = r2 < 0 ? maxRow : r2
    c2 = c2 < 0 ? maxColumn : c2
    const gc = this._overlayGC
    gc.save()
    gc.beginPath()
    gc.rect(hw, hh, pw, ph)
    gc.clip()
    if (fill) {
      gc.fillStyle = fill
    }
    if (stroke) {
      gc.strokeStyle = stroke
      gc.lineWidth = 1
    }
    for (const s of model.selections()) {
      if (s.r1 < r1 && s.r2 < r1) {
        continue
      }
      if (s.r1 > r2 && s.r2 > r2) {
        continue
      }
      if (s.c1 < c1 && s.c2 < c1) {
        continue
      }
      if (s.c1 > c2 && s.c2 > c2) {
        continue
      }
      let sr1 = Math.max(0, Math.min(s.r1, maxRow))
      let sc1 = Math.max(0, Math.min(s.c1, maxColumn))
      let sr2 = Math.max(0, Math.min(s.r2, maxRow))
      let sc2 = Math.max(0, Math.min(s.c2, maxColumn))
      let tmp: number
      if (sr1 > sr2) {
        tmp = sr1
        sr1 = sr2
        sr2 = tmp
      }
      if (sc1 > sc2) {
        tmp = sc1
        sc1 = sc2
        sc2 = tmp
      }
      const joinedGroup = CellGroup.joinCellGroupWithMergedCellGroups(
        this.dataModel!,
        { r1: sr1, r2: sr2, c1: sc1, c2: sc2 },
        "body"
      )
      sr1 = joinedGroup.r1
      sr2 = joinedGroup.r2
      sc1 = joinedGroup.c1
      sc2 = joinedGroup.c2
      let x1 = this._columnSections.offsetOf(sc1) - sx + hw
      let y1 = this._rowSections.offsetOf(sr1) - sy + hh
      let x2 = this._columnSections.extentOf(sc2) - sx + hw
      let y2 = this._rowSections.extentOf(sr2) - sy + hh
      if (this._stretchLastColumn && pw > bw && sc2 === maxColumn) {
        x2 = hw + pw - 1
      }
      if (this._stretchLastRow && ph > bh && sr2 === maxRow) {
        y2 = hh + ph - 1
      }
      x1 = Math.max(hw - 1, x1)
      y1 = Math.max(hh - 1, y1)
      x2 = Math.min(hw + pw + 1, x2)
      y2 = Math.min(hh + ph + 1, y2)
      if (x2 < x1 || y2 < y1) {
        continue
      }
      if (fill) {
        gc.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1)
      }
      if (stroke) {
        gc.strokeRect(x1 - 0.5, y1 - 0.5, x2 - x1 + 1, y2 - y1 + 1)
      }
    }
    gc.restore()
  }
  private _drawRowHeaderSelections(): void {
    const model = this._selectionModel
    if (!model || model.isEmpty || model.selectionMode == "column") {
      return
    }
    if (this.headerWidth === 0 || this.pageHeight === 0) {
      return
    }
    const fill = this._style.headerSelectionFillColor
    const stroke = this._style.headerSelectionBorderColor
    if (!fill && !stroke) {
      return
    }
    const sy = this._scrollY
    const bh = this.bodyHeight
    const ph = this.pageHeight
    const hw = this.headerWidth
    const hh = this.headerHeight
    const rs = this._rowSections
    const gc = this._overlayGC
    gc.save()
    gc.beginPath()
    gc.rect(0, hh, hw, ph)
    gc.clip()
    if (fill) {
      gc.fillStyle = fill
    }
    if (stroke) {
      gc.strokeStyle = stroke
      gc.lineWidth = 1
    }
    const maxRow = rs.count - 1
    const r1 = rs.indexOf(sy)
    let r2 = rs.indexOf(sy + ph - 1)
    r2 = r2 < 0 ? maxRow : r2
    for (let j = r1; j <= r2; ++j) {
      if (!model.isRowSelected(j)) {
        continue
      }
      const y = rs.offsetOf(j) - sy + hh
      let h = rs.sizeOf(j)
      if (this._stretchLastRow && ph > bh && j === maxRow) {
        h = hh + ph - y
      }
      if (h === 0) {
        continue
      }
      if (fill) {
        gc.fillRect(0, y, hw, h)
      }
      if (stroke) {
        gc.beginPath()
        gc.moveTo(hw - 0.5, y - 1)
        gc.lineTo(hw - 0.5, y + h)
        gc.stroke()
      }
    }
    gc.restore()
  }
  private _drawColumnHeaderSelections(): void {
    const model = this._selectionModel
    if (!model || model.isEmpty || model.selectionMode == "row") {
      return
    }
    if (this.headerHeight === 0 || this.pageWidth === 0) {
      return
    }
    const fill = this._style.headerSelectionFillColor
    const stroke = this._style.headerSelectionBorderColor
    if (!fill && !stroke) {
      return
    }
    const sx = this._scrollX
    const bw = this.bodyWidth
    const pw = this.pageWidth
    const hw = this.headerWidth
    const hh = this.headerHeight
    const cs = this._columnSections
    const gc = this._overlayGC
    gc.save()
    gc.beginPath()
    gc.rect(hw, 0, pw, hh)
    gc.clip()
    if (fill) {
      gc.fillStyle = fill
    }
    if (stroke) {
      gc.strokeStyle = stroke
      gc.lineWidth = 1
    }
    const maxCol = cs.count - 1
    const c1 = cs.indexOf(sx)
    let c2 = cs.indexOf(sx + pw - 1)
    c2 = c2 < 0 ? maxCol : c2
    for (let i = c1; i <= c2; ++i) {
      if (!model.isColumnSelected(i)) {
        continue
      }
      const x = cs.offsetOf(i) - sx + hw
      let w = cs.sizeOf(i)
      if (this._stretchLastColumn && pw > bw && i === maxCol) {
        w = hw + pw - x
      }
      if (w === 0) {
        continue
      }
      if (fill) {
        gc.fillRect(x, 0, w, hh)
      }
      if (stroke) {
        gc.beginPath()
        gc.moveTo(x - 1, hh - 0.5)
        gc.lineTo(x + w, hh - 0.5)
        gc.stroke()
      }
    }
    gc.restore()
  }
  private _drawCursor(): void {
    const model = this._selectionModel
    if (!model || model.isEmpty || model.selectionMode !== "cell") {
      return
    }
    const fill = this._style.cursorFillColor
    const stroke = this._style.cursorBorderColor
    if (!fill && !stroke) {
      return
    }
    let startRow = model.cursorRow
    let startColumn = model.cursorColumn
    const maxRow = this._rowSections.count - 1
    const maxColumn = this._columnSections.count - 1
    if (startRow < 0 || startRow > maxRow) {
      return
    }
    if (startColumn < 0 || startColumn > maxColumn) {
      return
    }
    let endRow = startRow
    let endColumn = startColumn
    const joinedGroup = CellGroup.joinCellGroupWithMergedCellGroups(
      this.dataModel!,
      { r1: startRow, r2: endRow, c1: startColumn, c2: endColumn },
      "body"
    )
    startRow = joinedGroup.r1
    endRow = joinedGroup.r2
    startColumn = joinedGroup.c1
    endColumn = joinedGroup.c2
    const sx = this._scrollX
    const sy = this._scrollY
    const bw = this.bodyWidth
    const bh = this.bodyHeight
    const pw = this.pageWidth
    const ph = this.pageHeight
    const hw = this.headerWidth
    const hh = this.headerHeight
    const vw = this._viewportWidth
    const vh = this._viewportHeight
    const x1 = this._columnSections.offsetOf(startColumn) - sx + hw
    let x2 = this._columnSections.extentOf(endColumn) - sx + hw
    const y1 = this._rowSections.offsetOf(startRow) - sy + hh
    let y2 = this._rowSections.extentOf(endRow) - sy + hh
    if (this._stretchLastColumn && pw > bw && startColumn === maxColumn) {
      x2 = vw - 1
    }
    if (this._stretchLastRow && ph > bh && startRow === maxRow) {
      y2 = vh - 1
    }
    if (x2 < x1 || y2 < y1) {
      return
    }
    if (x1 - 1 >= vw || y1 - 1 >= vh || x2 + 1 < hw || y2 + 1 < hh) {
      return
    }
    const gc = this._overlayGC
    gc.save()
    gc.beginPath()
    gc.rect(hw, hh, pw, ph)
    gc.clip()
    gc.clearRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1)
    if (fill) {
      gc.fillStyle = fill
      gc.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1)
    }
    if (stroke) {
      gc.strokeStyle = stroke
      gc.lineWidth = 2
      gc.strokeRect(x1, y1, x2 - x1, y2 - y1)
    }
    gc.restore()
  }
  private _drawShadows(): void {
    const shadow = this._style.scrollShadow
    if (!shadow) {
      return
    }
    const sx = this._scrollX
    const sy = this._scrollY
    const sxMax = this.maxScrollX
    const syMax = this.maxScrollY
    const hw = this.headerWidth
    const hh = this.headerHeight
    const pw = this.pageWidth
    const ph = this.pageHeight
    const vw = this._viewportWidth
    const vh = this._viewportHeight
    let bw = this.bodyWidth
    let bh = this.bodyHeight
    if (this._stretchLastRow && ph > bh) {
      bh = ph
    }
    if (this._stretchLastColumn && pw > bw) {
      bw = pw
    }
    const gc = this._overlayGC
    gc.save()
    if (sy > 0) {
      const x0 = 0
      const y0 = hh
      const x1 = 0
      const y1 = y0 + shadow.size
      const grad = gc.createLinearGradient(x0, y0, x1, y1)
      grad.addColorStop(0, shadow.color1)
      grad.addColorStop(0.5, shadow.color2)
      grad.addColorStop(1, shadow.color3)
      const x = 0
      const y = hh
      const w = hw + Math.min(pw, bw - sx)
      const h = shadow.size
      gc.fillStyle = grad
      gc.fillRect(x, y, w, h)
    }
    if (sx > 0) {
      const x0 = hw
      const y0 = 0
      const x1 = x0 + shadow.size
      const y1 = 0
      const grad = gc.createLinearGradient(x0, y0, x1, y1)
      grad.addColorStop(0, shadow.color1)
      grad.addColorStop(0.5, shadow.color2)
      grad.addColorStop(1, shadow.color3)
      const x = hw
      const y = 0
      const w = shadow.size
      const h = hh + Math.min(ph, bh - sy)
      gc.fillStyle = grad
      gc.fillRect(x, y, w, h)
    }
    if (sy < syMax) {
      const x0 = 0
      const y0 = vh
      const x1 = 0
      const y1 = vh - shadow.size
      const grad = gc.createLinearGradient(x0, y0, x1, y1)
      grad.addColorStop(0, shadow.color1)
      grad.addColorStop(0.5, shadow.color2)
      grad.addColorStop(1, shadow.color3)
      const x = 0
      const y = vh - shadow.size
      const w = hw + Math.min(pw, bw - sx)
      const h = shadow.size
      gc.fillStyle = grad
      gc.fillRect(x, y, w, h)
    }
    if (sx < sxMax) {
      const x0 = vw
      const y0 = 0
      const x1 = vw - shadow.size
      const y1 = 0
      const grad = gc.createLinearGradient(x0, y0, x1, y1)
      grad.addColorStop(0, shadow.color1)
      grad.addColorStop(0.5, shadow.color2)
      grad.addColorStop(1, shadow.color3)
      const x = vw - shadow.size
      const y = 0
      const w = shadow.size
      const h = hh + Math.min(ph, bh - sy)
      gc.fillStyle = grad
      gc.fillRect(x, y, w, h)
    }
    gc.restore()
  }
  private _viewport: Widget
  private _vScrollBar: ScrollBar
  private _hScrollBar: ScrollBar
  private _scrollCorner: Widget
  private _scrollX = 0
  private _scrollY = 0
  private _viewportWidth = 0
  private _viewportHeight = 0
  private _mousedown = false
  private _keyHandler: DataGrid.IKeyHandler | null = null
  private _mouseHandler: DataGrid.IMouseHandler | null = null
  private _vScrollBarMinWidth = 0
  private _hScrollBarMinHeight = 0
  private _dpiRatio = Math.ceil(window.devicePixelRatio)
  private _canvas: HTMLCanvasElement
  private _buffer: HTMLCanvasElement
  private _overlay: HTMLCanvasElement
  private _canvasGC: CanvasRenderingContext2D
  private _bufferGC: CanvasRenderingContext2D
  private _overlayGC: CanvasRenderingContext2D
  private _rowSections: SectionList
  private _columnSections: SectionList
  private _rowHeaderSections: SectionList
  private _columnHeaderSections: SectionList
  private _dataModel: DataModel | null = null
  private _selectionModel: SelectionModel | null = null
  private _stretchLastRow: boolean
  private _stretchLastColumn: boolean
  private _style: DataGrid.Style
  private _cellRenderers: RendererMap
  private _copyConfig: DataGrid.CopyConfig
  private _headerVisibility: DataGrid.HeaderVisibility
  private _editorController: ICellEditorController | null
  private _editingEnabled: boolean = false
}
export namespace DataGrid {
  export type Style = {
    readonly voidColor?: string
    readonly backgroundColor?: string
    readonly rowBackgroundColor?: (index: number) => string
    readonly columnBackgroundColor?: (index: number) => string
    readonly gridLineColor?: string
    readonly verticalGridLineColor?: string
    readonly horizontalGridLineColor?: string
    readonly headerBackgroundColor?: string
    readonly headerGridLineColor?: string
    readonly headerVerticalGridLineColor?: string
    readonly headerHorizontalGridLineColor?: string
    readonly selectionFillColor?: string
    readonly selectionBorderColor?: string
    readonly cursorFillColor?: string
    readonly cursorBorderColor?: string
    readonly headerSelectionFillColor?: string
    readonly headerSelectionBorderColor?: string
    readonly scrollShadow?: {
      readonly size: number
      readonly color1: string
      readonly color2: string
      readonly color3: string
    }
  }
  export type DefaultSizes = {
    readonly rowHeight: number
    readonly columnWidth: number
    readonly rowHeaderWidth: number
    readonly columnHeaderHeight: number
  }
  export type MinimumSizes = {
    readonly rowHeight: number
    readonly columnWidth: number
    readonly rowHeaderWidth: number
    readonly columnHeaderHeight: number
  }
  export type HeaderVisibility = "all" | "row" | "column" | "none"
  export type ColumnFitType = "all" | "row-header" | "body"
  export type CopyFormatArgs = {
    region: DataModel.CellRegion
    row: number
    column: number
    value: any
    metadata: DataModel.Metadata
  }
  export type CopyFormatFunc = (args: CopyFormatArgs) => string
  export type CopyConfig = {
    readonly separator: string
    readonly headers: "none" | "row" | "column" | "all"
    readonly format: CopyFormatFunc
    readonly warningThreshold: number
  }
  export interface IOptions {
    style?: Style
    defaultSizes?: DefaultSizes
    minimumSizes?: MinimumSizes
    headerVisibility?: HeaderVisibility
    cellRenderers?: RendererMap
    defaultRenderer?: CellRenderer
    copyConfig?: CopyConfig
    stretchLastRow?: boolean
    stretchLastColumn?: boolean
  }
  export interface IKeyHandler extends IDisposable {
    onKeyDown(grid: DataGrid, event: KeyboardEvent): void
  }
  export interface IMouseHandler extends IDisposable {
    release(): void
    onMouseHover(grid: DataGrid, event: MouseEvent): void
    onMouseLeave(grid: DataGrid, event: MouseEvent): void
    onMouseDown(grid: DataGrid, event: MouseEvent): void
    onMouseMove(grid: DataGrid, event: MouseEvent): void
    onMouseUp(grid: DataGrid, event: MouseEvent): void
    onMouseDoubleClick(grid: DataGrid, event: MouseEvent): void
    onContextMenu(grid: DataGrid, event: MouseEvent): void
    onWheel(grid: DataGrid, event: WheelEvent): void
  }
  export type HitTestResult = {
    readonly region: DataModel.CellRegion | "void"
    readonly row: number
    readonly column: number
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
  export function copyFormatGeneric(args: CopyFormatArgs): string {
    if (args.value === null || args.value === undefined) {
      return ""
    }
    return String(args.value)
  }
  export const defaultStyle: Style = {
    voidColor: "#F3F3F3",
    backgroundColor: "#FFFFFF",
    gridLineColor: "rgba(20, 20, 20, 0.15)",
    headerBackgroundColor: "#F3F3F3",
    headerGridLineColor: "rgba(20, 20, 20, 0.25)",
    selectionFillColor: "rgba(49, 119, 229, 0.2)",
    selectionBorderColor: "rgba(0, 107, 247, 1.0)",
    cursorBorderColor: "rgba(0, 107, 247, 1.0)",
    headerSelectionFillColor: "rgba(20, 20, 20, 0.1)",
    headerSelectionBorderColor: "rgba(0, 107, 247, 1.0)",
    scrollShadow: {
      size: 10,
      color1: "rgba(0, 0, 0, 0.20)",
      color2: "rgba(0, 0, 0, 0.05)",
      color3: "rgba(0, 0, 0, 0.00)",
    },
  }
  export const defaultSizes: DefaultSizes = {
    rowHeight: 20,
    columnWidth: 64,
    rowHeaderWidth: 64,
    columnHeaderHeight: 20,
  }
  export const minimumSizes: MinimumSizes = {
    rowHeight: 20,
    columnWidth: 10,
    rowHeaderWidth: 10,
    columnHeaderHeight: 20,
  }
  export const defaultCopyConfig: CopyConfig = {
    separator: "\t",
    format: copyFormatGeneric,
    headers: "none",
    warningThreshold: 1e6,
  }
}
namespace Private {
  export const ScrollRequest = new ConflatableMessage("scroll-request")
  export const OverlayPaintRequest = new ConflatableMessage(
    "overlay-paint-request"
  )
  export function createCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas")
    canvas.width = 0
    canvas.height = 0
    return canvas
  }
  export function shouldPaintEverything(dataModel: DataModel): boolean {
    const colGroups = CellGroup.getCellGroupsAtRegion(
      dataModel!,
      "column-header"
    )
    const rowHeaderGroups = CellGroup.getCellGroupsAtRegion(
      dataModel!,
      "row-header"
    )
    const cornerHeaderGroups = CellGroup.getCellGroupsAtRegion(
      dataModel!,
      "corner-header"
    )
    const bodyGroups = CellGroup.getCellGroupsAtRegion(dataModel!, "body")
    return (
      colGroups.length > 0 ||
      rowHeaderGroups.length > 0 ||
      cornerHeaderGroups.length > 0 ||
      bodyGroups.length > 0
    )
  }
  export function regionHasMergedCells(
    dataModel: DataModel,
    region: DataModel.CellRegion
  ): boolean {
    const regionGroups = CellGroup.getCellGroupsAtRegion(dataModel!, region)
    return regionGroups.length > 0
  }
  export type PaintRegion = {
    xMin: number
    yMin: number
    xMax: number
    yMax: number
    x: number
    y: number
    width: number
    height: number
    region: DataModel.CellRegion
    row: number
    column: number
    rowSizes: number[]
    columnSizes: number[]
  }
  export class PaintRequest extends ConflatableMessage {
    constructor(
      region: DataModel.CellRegion | "all",
      r1: number,
      c1: number,
      r2: number,
      c2: number
    ) {
      super("paint-request")
      this._region = region
      this._r1 = r1
      this._c1 = c1
      this._r2 = r2
      this._c2 = c2
    }
    get region(): DataModel.CellRegion | "all" {
      return this._region
    }
    get r1(): number {
      return this._r1
    }
    get c1(): number {
      return this._c1
    }
    get r2(): number {
      return this._r2
    }
    get c2(): number {
      return this._c2
    }
    conflate(other: PaintRequest): boolean {
      if (this._region === "all") {
        return true
      }
      if (other._region === "all") {
        this._region = "all"
        return true
      }
      if (this._region !== other._region) {
        return false
      }
      this._r1 = Math.min(this._r1, other._r1)
      this._c1 = Math.min(this._c1, other._c1)
      this._r2 = Math.max(this._r2, other._r2)
      this._c2 = Math.max(this._c2, other._c2)
      return true
    }
    private _region: DataModel.CellRegion | "all"
    private _r1: number
    private _c1: number
    private _r2: number
    private _c2: number
  }
  export class RowResizeRequest extends ConflatableMessage {
    constructor(region: DataModel.RowRegion, index: number, size: number) {
      super("row-resize-request")
      this._region = region
      this._index = index
      this._size = size
    }
    get region(): DataModel.RowRegion {
      return this._region
    }
    get index(): number {
      return this._index
    }
    get size(): number {
      return this._size
    }
    conflate(other: RowResizeRequest): boolean {
      if (this._region !== other._region || this._index !== other._index) {
        return false
      }
      this._size = other._size
      return true
    }
    private _region: DataModel.RowRegion
    private _index: number
    private _size: number
  }
  export class ColumnResizeRequest extends ConflatableMessage {
    constructor(region: DataModel.ColumnRegion, index: number, size: number) {
      super("column-resize-request")
      this._region = region
      this._index = index
      this._size = size
    }
    get region(): DataModel.ColumnRegion {
      return this._region
    }
    get index(): number {
      return this._index
    }
    get size(): number {
      return this._size
    }
    conflate(other: ColumnResizeRequest): boolean {
      if (this._region !== other._region || this._index !== other._index) {
        return false
      }
      this._size = other._size
      return true
    }
    private _region: DataModel.ColumnRegion
    private _index: number
    private _size: number
  }
}
export abstract class DataModel {
  get changed(): ISignal<this, DataModel.ChangedArgs> {
    return this._changed
  }
  abstract rowCount(region: DataModel.RowRegion): number
  abstract columnCount(region: DataModel.ColumnRegion): number
  abstract data(region: DataModel.CellRegion, row: number, column: number): any
  groupCount(region: DataModel.CellRegion): number {
    return 0
  }
  metadata(
    region: DataModel.CellRegion,
    row: number,
    column: number
  ): DataModel.Metadata {
    return DataModel.emptyMetadata
  }
  group(region: DataModel.CellRegion, groupIndex: number): CellGroup | null {
    return null
  }
  protected emitChanged(args: DataModel.ChangedArgs): void {
    this._changed.emit(args)
  }
  private _changed = new Signal<this, DataModel.ChangedArgs>(this)
}
export abstract class MutableDataModel extends DataModel {
  abstract setData(
    region: DataModel.CellRegion,
    row: number,
    column: number,
    value: unknown
  ): boolean
}
export namespace DataModel {
  export type RowRegion = "body" | "column-header"
  export type ColumnRegion = "body" | "row-header"
  export type CellRegion =
    | "body"
    | "row-header"
    | "column-header"
    | "corner-header"
  export type Metadata = { [key: string]: any }
  export const emptyMetadata: Metadata = Object.freeze({})
  export type RowsChangedArgs = {
    readonly type: "rows-inserted" | "rows-removed"
    readonly region: RowRegion
    readonly index: number
    readonly span: number
  }
  export type ColumnsChangedArgs = {
    readonly type: "columns-inserted" | "columns-removed"
    readonly region: ColumnRegion
    readonly index: number
    readonly span: number
  }
  export type RowsMovedArgs = {
    readonly type: "rows-moved"
    readonly region: RowRegion
    readonly index: number
    readonly span: number
    readonly destination: number
  }
  export type ColumnsMovedArgs = {
    readonly type: "columns-moved"
    readonly region: ColumnRegion
    readonly index: number
    readonly span: number
    readonly destination: number
  }
  export type CellsChangedArgs = {
    readonly type: "cells-changed"
    readonly region: CellRegion
    readonly row: number
    readonly column: number
    readonly rowSpan: number
    readonly columnSpan: number
  }
  export type ModelResetArgs = {
    readonly type: "model-reset"
  }
  export type ChangedArgs =
    | RowsChangedArgs
    | ColumnsChangedArgs
    | RowsMovedArgs
    | ColumnsMovedArgs
    | CellsChangedArgs
    | ModelResetArgs
}
export class GraphicsContext implements IDisposable {
  constructor(context: CanvasRenderingContext2D) {
    this._context = context
    this._state = Private.State.create(context)
  }
  dispose(): void {
    if (this._disposed) {
      return
    }
    this._disposed = true
    while (this._state.next) {
      this._state = this._state.next
      this._context.restore()
    }
  }
  get isDisposed(): boolean {
    return this._disposed
  }
  get fillStyle(): string | CanvasGradient | CanvasPattern {
    return this._context.fillStyle
  }
  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    if (this._state.fillStyle !== value) {
      this._state.fillStyle = value
      this._context.fillStyle = value
    }
  }
  get strokeStyle(): string | CanvasGradient | CanvasPattern {
    return this._context.strokeStyle
  }
  set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
    if (this._state.strokeStyle !== value) {
      this._state.strokeStyle = value
      this._context.strokeStyle = value
    }
  }
  get font(): string {
    return this._context.font
  }
  set font(value: string) {
    if (this._state.font !== value) {
      this._state.font = value
      this._context.font = value
    }
  }
  get textAlign(): CanvasTextAlign {
    return this._context.textAlign
  }
  set textAlign(value: CanvasTextAlign) {
    if (this._state.textAlign !== value) {
      this._state.textAlign = value
      this._context.textAlign = value
    }
  }
  get textBaseline(): CanvasTextBaseline {
    return this._context.textBaseline
  }
  set textBaseline(value: CanvasTextBaseline) {
    if (this._state.textBaseline !== value) {
      this._state.textBaseline = value
      this._context.textBaseline = value
    }
  }
  get lineCap(): CanvasLineCap {
    return this._context.lineCap
  }
  set lineCap(value: CanvasLineCap) {
    if (this._state.lineCap !== value) {
      this._state.lineCap = value
      this._context.lineCap = value
    }
  }
  get lineDashOffset(): number {
    return this._context.lineDashOffset
  }
  set lineDashOffset(value: number) {
    if (this._state.lineDashOffset !== value) {
      this._state.lineDashOffset = value
      this._context.lineDashOffset = value
    }
  }
  get lineJoin(): CanvasLineJoin {
    return this._context.lineJoin
  }
  set lineJoin(value: CanvasLineJoin) {
    if (this._state.lineJoin !== value) {
      this._state.lineJoin = value
      this._context.lineJoin = value
    }
  }
  get lineWidth(): number {
    return this._context.lineWidth
  }
  set lineWidth(value: number) {
    if (this._state.lineWidth !== value) {
      this._state.lineWidth = value
      this._context.lineWidth = value
    }
  }
  get miterLimit(): number {
    return this._context.miterLimit
  }
  set miterLimit(value: number) {
    if (this._state.miterLimit !== value) {
      this._state.miterLimit = value
      this._context.miterLimit = value
    }
  }
  get shadowBlur(): number {
    return this._context.shadowBlur
  }
  set shadowBlur(value: number) {
    if (this._state.shadowBlur !== value) {
      this._state.shadowBlur = value
      this._context.shadowBlur = value
    }
  }
  get shadowColor(): string {
    return this._context.shadowColor
  }
  set shadowColor(value: string) {
    if (this._state.shadowColor !== value) {
      this._state.shadowColor = value
      this._context.shadowColor = value
    }
  }
  get shadowOffsetX(): number {
    return this._context.shadowOffsetX
  }
  set shadowOffsetX(value: number) {
    if (this._state.shadowOffsetX !== value) {
      this._state.shadowOffsetX = value
      this._context.shadowOffsetX = value
    }
  }
  get shadowOffsetY(): number {
    return this._context.shadowOffsetY
  }
  set shadowOffsetY(value: number) {
    if (this._state.shadowOffsetY !== value) {
      this._state.shadowOffsetY = value
      this._context.shadowOffsetY = value
    }
  }
  get imageSmoothingEnabled(): boolean {
    return this._context.imageSmoothingEnabled
  }
  set imageSmoothingEnabled(value: boolean) {
    if (this._state.imageSmoothingEnabled !== value) {
      this._state.imageSmoothingEnabled = value
      this._context.imageSmoothingEnabled = value
    }
  }
  get globalAlpha(): number {
    return this._context.globalAlpha
  }
  set globalAlpha(value: number) {
    if (this._state.globalAlpha !== value) {
      this._state.globalAlpha = value
      this._context.globalAlpha = value
    }
  }
  get globalCompositeOperation(): GlobalCompositeOperation {
    return this._context.globalCompositeOperation
  }
  set globalCompositeOperation(value: GlobalCompositeOperation) {
    if (this._state.globalCompositeOperation !== value) {
      this._state.globalCompositeOperation = value
      this._context.globalCompositeOperation = value
    }
  }
  getLineDash(): number[] {
    return this._context.getLineDash()
  }
  setLineDash(segments: number[]): void {
    this._context.setLineDash(segments)
  }
  rotate(angle: number): void {
    this._context.rotate(angle)
  }
  scale(x: number, y: number): void {
    this._context.scale(x, y)
  }
  transform(
    m11: number,
    m12: number,
    m21: number,
    m22: number,
    dx: number,
    dy: number
  ): void {
    this._context.transform(m11, m12, m21, m22, dx, dy)
  }
  translate(x: number, y: number): void {
    this._context.translate(x, y)
  }
  setTransform(
    m11: number,
    m12: number,
    m21: number,
    m22: number,
    dx: number,
    dy: number
  ): void {
    this._context.setTransform(m11, m12, m21, m22, dx, dy)
  }
  save(): void {
    this._state = Private.State.push(this._state)
    this._context.save()
  }
  restore(): void {
    if (!this._state.next) {
      return
    }
    this._state = Private.State.pop(this._state)
    this._context.restore()
  }
  beginPath(): void {
    return this._context.beginPath()
  }
  closePath(): void {
    this._context.closePath()
  }
  isPointInPath(x: number, y: number, fillRule?: CanvasFillRule): boolean {
    let result: boolean
    if (arguments.length === 2) {
      result = this._context.isPointInPath(x, y)
    } else {
      result = this._context.isPointInPath(x, y, fillRule)
    }
    return result
  }
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ): void {
    if (arguments.length === 5) {
      this._context.arc(x, y, radius, startAngle, endAngle)
    } else {
      this._context.arc(x, y, radius, startAngle, endAngle, anticlockwise)
    }
  }
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this._context.arcTo(x1, y1, x2, y2, radius)
  }
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    this._context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
  }
  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    anticlockwise?: boolean
  ): void {
    if (arguments.length === 7) {
      this._context.ellipse(
        x,
        y,
        radiusX,
        radiusY,
        rotation,
        startAngle,
        endAngle
      )
    } else {
      this._context.ellipse(
        x,
        y,
        radiusX,
        radiusY,
        rotation,
        startAngle,
        endAngle,
        anticlockwise
      )
    }
  }
  lineTo(x: number, y: number): void {
    this._context.lineTo(x, y)
  }
  moveTo(x: number, y: number): void {
    this._context.moveTo(x, y)
  }
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this._context.quadraticCurveTo(cpx, cpy, x, y)
  }
  rect(x: number, y: number, w: number, h: number): void {
    this._context.rect(x, y, w, h)
  }
  clip(fillRule?: CanvasFillRule): void {
    if (arguments.length === 0) {
      this._context.clip()
    } else {
      this._context.clip(fillRule)
    }
  }
  fill(fillRule?: CanvasFillRule): void {
    if (arguments.length === 0) {
      this._context.fill()
    } else {
      this._context.fill(fillRule)
    }
  }
  stroke(): void {
    this._context.stroke()
  }
  clearRect(x: number, y: number, w: number, h: number): void {
    return this._context.clearRect(x, y, w, h)
  }
  fillRect(x: number, y: number, w: number, h: number): void {
    this._context.fillRect(x, y, w, h)
  }
  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    if (arguments.length === 3) {
      this._context.fillText(text, x, y)
    } else {
      this._context.fillText(text, x, y, maxWidth)
    }
  }
  strokeRect(x: number, y: number, w: number, h: number): void {
    this._context.strokeRect(x, y, w, h)
  }
  strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    if (arguments.length === 3) {
      this._context.strokeText(text, x, y)
    } else {
      this._context.strokeText(text, x, y, maxWidth)
    }
  }
  measureText(text: string): TextMetrics {
    return this._context.measureText(text)
  }
  createLinearGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): CanvasGradient {
    return this._context.createLinearGradient(x0, y0, x1, y1)
  }
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ): CanvasGradient {
    return this._context.createRadialGradient(x0, y0, r0, x1, y1, r1)
  }
  createPattern(
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    repetition: string
  ): CanvasPattern | null {
    return this._context.createPattern(image, repetition)
  }
  createImageData(imageData: ImageData): ImageData
  createImageData(sw: number, sh: number): ImageData
  createImageData(): ImageData {
    return this._context.createImageData.apply(this._context, arguments)
  }
  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    return this._context.getImageData(sx, sy, sw, sh)
  }
  putImageData(imagedata: ImageData, dx: number, dy: number): void
  putImageData(
    imagedata: ImageData,
    dx: number,
    dy: number,
    dirtyX: number,
    dirtyY: number,
    dirtyWidth: number,
    dirtyHeight: number
  ): void
  putImageData(): void {
    this._context.putImageData.apply(this._context, arguments)
  }
  drawImage(
    image:
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement
      | ImageBitmap,
    dstX: number,
    dstY: number
  ): void
  drawImage(
    image:
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement
      | ImageBitmap,
    dstX: number,
    dstY: number,
    dstW: number,
    dstH: number
  ): void
  drawImage(
    image:
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement
      | ImageBitmap,
    srcX: number,
    srcY: number,
    srcW: number,
    srcH: number,
    dstX: number,
    dstY: number,
    dstW: number,
    dstH: number
  ): void
  drawImage(): void {
    this._context.drawImage.apply(this._context, arguments)
  }
  drawFocusIfNeeded(element: Element): void {
    this._context.drawFocusIfNeeded(element)
  }
  private _disposed = false
  private _state: Private.State
  private _context: CanvasRenderingContext2D
}
namespace Private {
  let pi = -1
  const pool: State[] = []
  export class State {
    static create(context: CanvasRenderingContext2D): State {
      const state = pi < 0 ? new State() : pool[pi--]
      state.next = null
      state.fillStyle = context.fillStyle
      state.font = context.font
      state.globalAlpha = context.globalAlpha
      state.globalCompositeOperation = context.globalCompositeOperation
      state.imageSmoothingEnabled = context.imageSmoothingEnabled
      state.lineCap = context.lineCap
      state.lineDashOffset = context.lineDashOffset
      state.lineJoin = context.lineJoin
      state.lineWidth = context.lineWidth
      state.miterLimit = context.miterLimit
      state.shadowBlur = context.shadowBlur
      state.shadowColor = context.shadowColor
      state.shadowOffsetX = context.shadowOffsetX
      state.shadowOffsetY = context.shadowOffsetY
      state.strokeStyle = context.strokeStyle
      state.textAlign = context.textAlign
      state.textBaseline = context.textBaseline
      return state
    }
    static push(other: State): State {
      const state = pi < 0 ? new State() : pool[pi--]
      state.next = other
      state.fillStyle = other.fillStyle
      state.font = other.font
      state.globalAlpha = other.globalAlpha
      state.globalCompositeOperation = other.globalCompositeOperation
      state.imageSmoothingEnabled = other.imageSmoothingEnabled
      state.lineCap = other.lineCap
      state.lineDashOffset = other.lineDashOffset
      state.lineJoin = other.lineJoin
      state.lineWidth = other.lineWidth
      state.miterLimit = other.miterLimit
      state.shadowBlur = other.shadowBlur
      state.shadowColor = other.shadowColor
      state.shadowOffsetX = other.shadowOffsetX
      state.shadowOffsetY = other.shadowOffsetY
      state.strokeStyle = other.strokeStyle
      state.textAlign = other.textAlign
      state.textBaseline = other.textBaseline
      return state
    }
    static pop(state: State): State {
      state.fillStyle = ""
      state.strokeStyle = ""
      pool[++pi] = state
      return state.next!
    }
    next: State | null
    fillStyle: string | CanvasGradient | CanvasPattern
    font: string
    globalAlpha: number
    globalCompositeOperation: string
    imageSmoothingEnabled: boolean
    lineCap: string
    lineDashOffset: number
    lineJoin: string
    lineWidth: number
    miterLimit: number
    shadowBlur: number
    shadowColor: string
    shadowOffsetX: number
    shadowOffsetY: number
    strokeStyle: string | CanvasGradient | CanvasPattern
    textAlign: string
    textBaseline: string
  }
}
export class HyperlinkRenderer extends TextRenderer {
  constructor(options: HyperlinkRenderer.IOptions = {}) {
    options.textColor = options.textColor || "navy"
    options.font = options.font || "bold 12px sans-serif"
    super(options)
    this.url = options.url
    this.urlName = options.urlName
  }
  readonly url: CellRenderer.ConfigOption<string> | undefined
  readonly urlName: CellRenderer.ConfigOption<string> | undefined
  drawText(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    const font = CellRenderer.resolveOption(this.font, config)
    if (!font) {
      return
    }
    const urlName = CellRenderer.resolveOption(this.urlName, config)
    const color = CellRenderer.resolveOption(this.textColor, config)
    if (!color) {
      return
    }
    const format = this.format
    let text
    if (urlName) {
      text = format({
        ...config,
        value: urlName,
      } as CellRenderer.CellConfig)
    } else {
      text = format(config)
    }
    if (!text) {
      return
    }
    const vAlign = CellRenderer.resolveOption(this.verticalAlignment, config)
    const hAlign = CellRenderer.resolveOption(this.horizontalAlignment, config)
    const elideDirection = CellRenderer.resolveOption(
      this.elideDirection,
      config
    )
    const wrapText = CellRenderer.resolveOption(this.wrapText, config)
    const boxHeight = config.height - (vAlign === "center" ? 1 : 2)
    if (boxHeight <= 0) {
      return
    }
    const textHeight = HyperlinkRenderer.measureFontHeight(font)
    let textX: number
    let textY: number
    let boxWidth: number
    switch (vAlign) {
      case "top":
        textY = config.y + 2 + textHeight
        break
      case "center":
        textY = config.y + config.height / 2 + textHeight / 2
        break
      case "bottom":
        textY = config.y + config.height - 2
        break
      default:
        throw "unreachable"
    }
    switch (hAlign) {
      case "left":
        textX = config.x + 8
        boxWidth = config.width - 14
        break
      case "center":
        textX = config.x + config.width / 2
        boxWidth = config.width
        break
      case "right":
        textX = config.x + config.width - 8
        boxWidth = config.width - 14
        break
      default:
        throw "unreachable"
    }
    if (textHeight > boxHeight) {
      gc.beginPath()
      gc.rect(config.x, config.y, config.width, config.height - 1)
      gc.clip()
    }
    gc.font = font
    gc.fillStyle = color
    gc.textAlign = hAlign
    gc.textBaseline = "bottom"
    let textWidth = gc.measureText(text).width
    if (wrapText && textWidth > boxWidth) {
      gc.beginPath()
      gc.rect(config.x, config.y, config.width, config.height - 1)
      gc.clip()
      const wordsInColumn = text.split(/\s(?=\b)/)
      let curY = textY
      let textInCurrentLine = wordsInColumn.shift()!
      if (wordsInColumn.length === 0) {
        let curLineTextWidth = gc.measureText(textInCurrentLine).width
        while (curLineTextWidth > boxWidth && textInCurrentLine !== "") {
          for (let i = textInCurrentLine.length; i > 0; i--) {
            const curSubString = textInCurrentLine.substring(0, i)
            const curSubStringWidth = gc.measureText(curSubString).width
            if (curSubStringWidth < boxWidth || curSubString.length === 1) {
              const nextLineText = textInCurrentLine.substring(
                i,
                textInCurrentLine.length
              )
              textInCurrentLine = nextLineText
              curLineTextWidth = gc.measureText(textInCurrentLine).width
              gc.fillText(curSubString, textX, curY)
              curY += textHeight
              break
            }
          }
        }
      } else {
        while (wordsInColumn.length !== 0) {
          const curWord = wordsInColumn.shift()
          const incrementedText = [textInCurrentLine, curWord].join(" ")
          const incrementedTextWidth = gc.measureText(incrementedText).width
          if (incrementedTextWidth > boxWidth) {
            gc.fillText(textInCurrentLine, textX, curY)
            curY += textHeight
            textInCurrentLine = curWord!
          } else {
            textInCurrentLine = incrementedText
          }
        }
      }
      gc.fillText(textInCurrentLine!, textX, curY)
      return
    }
    const elide = "\u2026"
    if (elideDirection === "right") {
      while (textWidth > boxWidth && text.length > 1) {
        if (text.length > 4 && textWidth >= 2 * boxWidth) {
          text = text.substring(0, text.length / 2 + 1) + elide
        } else {
          text = text.substring(0, text.length - 2) + elide
        }
        textWidth = gc.measureText(text).width
      }
    } else {
      while (textWidth > boxWidth && text.length > 1) {
        if (text.length > 4 && textWidth >= 2 * boxWidth) {
          text = elide + text.substring(text.length / 2)
        } else {
          text = elide + text.substring(2)
        }
        textWidth = gc.measureText(text).width
      }
    }
    gc.fillText(text, textX, textY)
  }
}
export namespace HyperlinkRenderer {
  export type VerticalAlignment = "top" | "center" | "bottom"
  export type HorizontalAlignment = "left" | "center" | "right"
  export type ElideDirection = "left" | "right"
  export interface IOptions extends TextRenderer.IOptions {
    url?: CellRenderer.ConfigOption<string> | undefined
    urlName?: CellRenderer.ConfigOption<string> | undefined
  }
}
export class JSONModel extends DataModel {
  constructor(options: JSONModel.IOptions) {
    super()
    const split = Private.splitFields(options.schema)
    this._data = options.data
    this._bodyFields = split.bodyFields
    this._headerFields = split.headerFields
    this._missingValues = Private.createMissingMap(options.schema)
  }
  rowCount(region: DataModel.RowRegion): number {
    if (region === "body") {
      return this._data.length
    }
    return 1
  }
  columnCount(region: DataModel.ColumnRegion): number {
    if (region === "body") {
      return this._bodyFields.length
    }
    return this._headerFields.length
  }
  data(region: DataModel.CellRegion, row: number, column: number): any {
    let field: JSONModel.Field
    let value: any
    switch (region) {
      case "body":
        field = this._bodyFields[column]
        value = this._data[row][field.name]
        break
      case "column-header":
        field = this._bodyFields[column]
        value = field.title || field.name
        break
      case "row-header":
        field = this._headerFields[column]
        value = this._data[row][field.name]
        break
      case "corner-header":
        field = this._headerFields[column]
        value = field.title || field.name
        break
      default:
        throw "unreachable"
    }
    const missing =
      this._missingValues !== null &&
      typeof value === "string" &&
      this._missingValues[value] === true
    return missing ? null : value
  }
  metadata(
    region: DataModel.CellRegion,
    row: number,
    column: number
  ): DataModel.Metadata {
    if (region === "body" || region === "column-header") {
      return this._bodyFields[column]
    }
    return this._headerFields[column]
  }
  private _data: JSONModel.DataSource
  private _bodyFields: JSONModel.Field[]
  private _headerFields: JSONModel.Field[]
  private _missingValues: Private.MissingValuesMap | null
}
export namespace JSONModel {
  export type Field = {
    readonly name: string
    readonly type?: string
    readonly format?: string
    readonly title?: string
  }
  export type Schema = {
    readonly fields: Field[]
    readonly missingValues?: string[]
    readonly primaryKey?: string | string[]
  }
  export type DataSource = ReadonlyArray<ReadonlyJSONObject>
  export interface IOptions {
    schema: Schema
    data: DataSource
  }
}
namespace Private {
  export type SplitFieldsResult = {
    bodyFields: JSONModel.Field[]
    headerFields: JSONModel.Field[]
  }
  export function splitFields(schema: JSONModel.Schema): SplitFieldsResult {
    let primaryKeys: string[]
    if (schema.primaryKey === undefined) {
      primaryKeys = []
    } else if (typeof schema.primaryKey === "string") {
      primaryKeys = [schema.primaryKey]
    } else {
      primaryKeys = schema.primaryKey
    }
    const bodyFields: JSONModel.Field[] = []
    const headerFields: JSONModel.Field[] = []
    for (const field of schema.fields) {
      if (primaryKeys.indexOf(field.name) === -1) {
        bodyFields.push(field)
      } else {
        headerFields.push(field)
      }
    }
    return { bodyFields, headerFields }
  }
  export type MissingValuesMap = { [key: string]: boolean }
  export function createMissingMap(
    schema: JSONModel.Schema
  ): MissingValuesMap | null {
    if (!schema.missingValues || schema.missingValues.length === 0) {
      return null
    }
    const result: MissingValuesMap = Object.create(null)
    for (const value of schema.missingValues) {
      result[value] = true
    }
    return result
  }
}
export class Notification extends Widget {
  constructor(options: Notification.IOptions) {
    super({ node: Private.createNode() })
    this.addClass("lm-DataGrid-notification")
    this.setFlag(Widget.Flag.DisallowLayout)
    this._target = options.target
    this._message = options.message || ""
    this._placement = options.placement || "bottom"
    Widget.attach(this, document.body)
    if (options.timeout && options.timeout > 0) {
      setTimeout(() => {
        this.close()
      }, options.timeout)
    }
  }
  handleEvent(event: Event): void {
    switch (event.type) {
      case "mousedown":
        this._evtMouseDown(event as MouseEvent)
        break
      case "contextmenu":
        event.preventDefault()
        event.stopPropagation()
        break
    }
  }
  get placement(): Notification.Placement {
    return this._placement
  }
  set placement(value: Notification.Placement) {
    if (this._placement === value) {
      return
    }
    this._placement = value
    this.update()
  }
  get message(): string {
    return this._message
  }
  set message(value: string) {
    if (this._message === value) {
      return
    }
    this._message = value
    this.update()
  }
  get messageNode(): HTMLSpanElement {
    return this.node.getElementsByClassName(
      "lm-DataGrid-notificationMessage"
    )[0] as HTMLSpanElement
  }
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener("mousedown", this)
    this.update()
  }
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener("mousedown", this)
  }
  protected onUpdateRequest(msg: Message): void {
    const targetRect = this._target.getBoundingClientRect()
    const style = this.node.style
    switch (this._placement) {
      case "bottom":
        style.left = targetRect.left + "px"
        style.top = targetRect.bottom + "px"
        break
      case "top":
        style.left = targetRect.left + "px"
        style.height = targetRect.top + "px"
        style.top = "0"
        style.alignItems = "flex-end"
        style.justifyContent = "flex-end"
        break
      case "left":
        style.left = "0"
        style.width = targetRect.left + "px"
        style.top = targetRect.top + "px"
        style.alignItems = "flex-end"
        style.justifyContent = "flex-end"
        break
      case "right":
        style.left = targetRect.right + "px"
        style.top = targetRect.top + "px"
        break
    }
    this.messageNode.innerHTML = this._message
  }
  private _evtMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    this.close()
  }
  private _target: HTMLElement
  private _message: string = ""
  private _placement: Notification.Placement
}
export namespace Notification {
  export type Placement = "top" | "bottom" | "left" | "right"
  export interface IOptions {
    target: HTMLElement
    message?: string
    placement?: Placement
    timeout?: number
  }
}
namespace Private {
  export function createNode(): HTMLElement {
    const node = document.createElement("div")
    const container = document.createElement("div")
    container.className = "lm-DataGrid-notificationContainer"
    const message = document.createElement("span")
    message.className = "lm-DataGrid-notificationMessage"
    container.appendChild(message)
    node.appendChild(container)
    return node
  }
}
export class RendererMap {
  constructor(values: RendererMap.Values = {}, fallback?: CellRenderer) {
    this._values = { ...values }
    this._fallback = fallback || new TextRenderer()
  }
  get changed(): ISignal<this, void> {
    return this._changed
  }
  get(config: CellRenderer.CellConfig): CellRenderer {
    let renderer = this._values[config.region]
    if (typeof renderer === "function") {
      try {
        renderer = renderer(config)
      } catch (err) {
        renderer = undefined
        console.error(err)
      }
    }
    return renderer || this._fallback
  }
  update(values: RendererMap.Values = {}, fallback?: CellRenderer): void {
    this._values = { ...this._values, ...values }
    this._fallback = fallback || this._fallback
    this._changed.emit(undefined)
  }
  private _fallback: CellRenderer
  private _values: RendererMap.Values
  private _changed = new Signal<this, void>(this)
}
export namespace RendererMap {
  export type Resolver = CellRenderer.ConfigFunc<CellRenderer | undefined>
  export type Values = {
    [R in DataModel.CellRegion]?: Resolver | CellRenderer | undefined
  }
}
export class SectionList {
  constructor(options: SectionList.IOptions) {
    this._minimumSize = options.minimumSize || 2
    this._defaultSize = Math.max(
      this._minimumSize,
      Math.floor(options.defaultSize)
    )
  }
  get length(): number {
    return this._length
  }
  get count(): number {
    return this._count
  }
  get minimumSize(): number {
    return this._minimumSize
  }
  set minimumSize(value: number) {
    value = Math.max(2, Math.floor(value))
    if (this._minimumSize === value) {
      return
    }
    this._minimumSize = value
    if (value > this._defaultSize) {
      this.defaultSize = value
    }
  }
  get defaultSize(): number {
    return this._defaultSize
  }
  set defaultSize(value: number) {
    value = Math.max(this._minimumSize, Math.floor(value))
    if (this._defaultSize === value) {
      return
    }
    const delta = value - this._defaultSize
    this._defaultSize = value
    this._length += delta * (this._count - this._sections.length)
    if (this._sections.length === 0) {
      return
    }
    for (let i = 0, n = this._sections.length; i < n; ++i) {
      const prev = this._sections[i - 1]
      const curr = this._sections[i]
      if (prev) {
        const count = curr.index - prev.index - 1
        curr.offset = prev.offset + prev.size + count * value
      } else {
        curr.offset = curr.index * value
      }
    }
  }
  clampSize(size: number): number {
    return Math.max(this._minimumSize, Math.floor(size))
  }
  indexOf(offset: number): number {
    if (offset < 0 || offset >= this._length || this._count === 0) {
      return -1
    }
    if (this._sections.length === 0) {
      return Math.floor(offset / this._defaultSize)
    }
    const i = ArrayExt.lowerBound(this._sections, offset, Private.offsetCmp)
    if (i < this._sections.length && this._sections[i].offset <= offset) {
      return this._sections[i].index
    }
    if (i === 0) {
      return Math.floor(offset / this._defaultSize)
    }
    const section = this._sections[i - 1]
    const span = offset - (section.offset + section.size)
    return section.index + Math.floor(span / this._defaultSize) + 1
  }
  offsetOf(index: number): number {
    if (index < 0 || index >= this._count) {
      return -1
    }
    if (this._sections.length === 0) {
      return index * this._defaultSize
    }
    const i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp)
    if (i < this._sections.length && this._sections[i].index === index) {
      return this._sections[i].offset
    }
    if (i === 0) {
      return index * this._defaultSize
    }
    const section = this._sections[i - 1]
    const span = index - section.index - 1
    return section.offset + section.size + span * this._defaultSize
  }
  extentOf(index: number): number {
    if (index < 0 || index >= this._count) {
      return -1
    }
    if (this._sections.length === 0) {
      return (index + 1) * this._defaultSize - 1
    }
    const i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp)
    if (i < this._sections.length && this._sections[i].index === index) {
      return this._sections[i].offset + this._sections[i].size - 1
    }
    if (i === 0) {
      return (index + 1) * this._defaultSize - 1
    }
    const section = this._sections[i - 1]
    const span = index - section.index
    return section.offset + section.size + span * this._defaultSize - 1
  }
  sizeOf(index: number): number {
    if (index < 0 || index >= this._count) {
      return -1
    }
    if (this._sections.length === 0) {
      return this._defaultSize
    }
    const i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp)
    if (i < this._sections.length && this._sections[i].index === index) {
      return this._sections[i].size
    }
    return this._defaultSize
  }
  resize(index: number, size: number): void {
    if (index < 0 || index >= this._count) {
      return
    }
    size = Math.max(this._minimumSize, Math.floor(size))
    const i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp)
    let delta: number
    if (i < this._sections.length && this._sections[i].index === index) {
      const section = this._sections[i]
      delta = size - section.size
      section.size = size
    } else if (i === 0) {
      const offset = index * this._defaultSize
      ArrayExt.insert(this._sections, i, { index, offset, size })
      delta = size - this._defaultSize
    } else {
      const section = this._sections[i - 1]
      const span = index - section.index - 1
      const offset = section.offset + section.size + span * this._defaultSize
      ArrayExt.insert(this._sections, i, { index, offset, size })
      delta = size - this._defaultSize
    }
    this._length += delta
    for (let j = i + 1, n = this._sections.length; j < n; ++j) {
      this._sections[j].offset += delta
    }
  }
  insert(index: number, count: number): void {
    if (count <= 0) {
      return
    }
    index = Math.max(0, Math.min(index, this._count))
    const span = count * this._defaultSize
    this._count += count
    this._length += span
    if (this._sections.length === 0) {
      return
    }
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp)
    for (let n = this._sections.length; i < n; ++i) {
      const section = this._sections[i]
      section.index += count
      section.offset += span
    }
  }
  remove(index: number, count: number): void {
    if (index < 0 || index >= this._count || count <= 0) {
      return
    }
    count = Math.min(this._count - index, count)
    if (this._sections.length === 0) {
      this._count -= count
      this._length -= count * this._defaultSize
      return
    }
    if (count === this._count) {
      this._length = 0
      this._count = 0
      this._sections.length = 0
      return
    }
    const i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp)
    const j = ArrayExt.lowerBound(
      this._sections,
      index + count,
      Private.indexCmp
    )
    const removed = this._sections.splice(i, j - i)
    let span = (count - removed.length) * this._defaultSize
    for (let k = 0, n = removed.length; k < n; ++k) {
      span += removed[k].size
    }
    this._count -= count
    this._length -= span
    for (let k = i, n = this._sections.length; k < n; ++k) {
      const section = this._sections[k]
      section.index -= count
      section.offset -= span
    }
  }
  move(index: number, count: number, destination: number): void {
    if (index < 0 || index >= this._count || count <= 0) {
      return
    }
    if (this._sections.length === 0) {
      return
    }
    count = Math.min(count, this._count - index)
    destination = Math.min(Math.max(0, destination), this._count - count)
    if (index === destination) {
      return
    }
    const i1 = Math.min(index, destination)
    const k1 = ArrayExt.lowerBound(this._sections, i1, Private.indexCmp)
    if (k1 === this._sections.length) {
      return
    }
    const i2 = Math.max(index + count - 1, destination + count - 1)
    const k2 = ArrayExt.upperBound(this._sections, i2, Private.indexCmp) - 1
    if (k2 < k1) {
      return
    }
    const pivot = destination < index ? index : index + count
    const count1 = pivot - i1
    const count2 = i2 - pivot + 1
    let span1 = count1 * this._defaultSize
    let span2 = count2 * this._defaultSize
    for (let j = k1; j <= k2; ++j) {
      const section = this._sections[j]
      if (section.index < pivot) {
        span1 += section.size - this._defaultSize
      } else {
        span2 += section.size - this._defaultSize
      }
    }
    const k3 = ArrayExt.lowerBound(this._sections, pivot, Private.indexCmp)
    if (k1 <= k3 && k3 <= k2) {
      ArrayExt.rotate(this._sections, k3 - k1, k1, k2)
    }
    for (let j = k1; j <= k2; ++j) {
      const section = this._sections[j]
      if (section.index < pivot) {
        section.index += count2
        section.offset += span2
      } else {
        section.index -= count1
        section.offset -= span1
      }
    }
  }
  reset(): void {
    this._sections.length = 0
    this._length = this._count * this._defaultSize
  }
  clear(): void {
    this._count = 0
    this._length = 0
    this._sections.length = 0
  }
  private _count = 0
  private _length = 0
  private _minimumSize: number
  private _defaultSize: number
  private _sections: Private.Section[] = []
}
export namespace SectionList {
  export interface IOptions {
    defaultSize: number
    minimumSize?: number
  }
}
namespace Private {
  export type Section = {
    index: number
    offset: number
    size: number
  }
  export function offsetCmp(section: Section, offset: number): number {
    if (offset < section.offset) {
      return 1
    }
    if (section.offset + section.size <= offset) {
      return -1
    }
    return 0
  }
  export function indexCmp(section: Section, index: number): number {
    return section.index - index
  }
}
export abstract class SelectionModel {
  constructor(options: SelectionModel.IOptions) {
    this.dataModel = options.dataModel
    this._selectionMode = options.selectionMode || "cell"
    this.dataModel.changed.connect(this.onDataModelChanged, this)
  }
  abstract readonly isEmpty: boolean
  abstract readonly cursorRow: number
  abstract readonly cursorColumn: number
  abstract moveCursorWithinSelections(
    direction: SelectionModel.CursorMoveDirection
  ): void
  abstract currentSelection(): SelectionModel.Selection | null
  abstract selections(): IterableIterator<SelectionModel.Selection>
  abstract select(args: SelectionModel.SelectArgs): void
  abstract clear(): void
  get changed(): ISignal<this, void> {
    return this._changed
  }
  readonly dataModel: DataModel
  get selectionMode(): SelectionModel.SelectionMode {
    return this._selectionMode
  }
  set selectionMode(value: SelectionModel.SelectionMode) {
    if (this._selectionMode === value) {
      return
    }
    this._selectionMode = value
    this.clear()
  }
  isRowSelected(index: number): boolean {
    return some(this.selections(), s => Private.containsRow(s, index))
  }
  isColumnSelected(index: number): boolean {
    return some(this.selections(), s => Private.containsColumn(s, index))
  }
  isCellSelected(row: number, column: number): boolean {
    return some(this.selections(), s => Private.containsCell(s, row, column))
  }
  protected onDataModelChanged(
    sender: DataModel,
    args: DataModel.ChangedArgs
  ): void {}
  protected emitChanged(): void {
    this._changed.emit(undefined)
  }
  private _changed = new Signal<this, void>(this)
  private _selectionMode: SelectionModel.SelectionMode = "cell"
}
export namespace SelectionModel {
  export type SelectionMode = "row" | "column" | "cell"
  export type CursorMoveDirection = "up" | "down" | "left" | "right" | "none"
  export type ClearMode = "all" | "current" | "none"
  export type SelectArgs = {
    r1: number
    c1: number
    r2: number
    c2: number
    cursorRow: number
    cursorColumn: number
    clear: ClearMode
  }
  export type Selection = {
    readonly r1: number
    readonly c1: number
    readonly r2: number
    readonly c2: number
  }
  export interface IOptions {
    dataModel: DataModel
    selectionMode?: SelectionMode
  }
}
namespace Private {
  export function containsRow(
    selection: SelectionModel.Selection,
    row: number
  ): boolean {
    const { r1, r2 } = selection
    return (row >= r1 && row <= r2) || (row >= r2 && row <= r1)
  }
  export function containsColumn(
    selection: SelectionModel.Selection,
    column: number
  ): boolean {
    const { c1, c2 } = selection
    return (column >= c1 && column <= c2) || (column >= c2 && column <= c1)
  }
  export function containsCell(
    selection: SelectionModel.Selection,
    row: number,
    column: number
  ): boolean {
    return containsRow(selection, row) && containsColumn(selection, column)
  }
}
export class TextRenderer extends CellRenderer {
  constructor(options: TextRenderer.IOptions = {}) {
    super()
    this.font = options.font || "12px sans-serif"
    this.textColor = options.textColor || "#000000"
    this.backgroundColor = options.backgroundColor || ""
    this.verticalAlignment = options.verticalAlignment || "center"
    this.horizontalAlignment = options.horizontalAlignment || "left"
    this.format = options.format || TextRenderer.formatGeneric()
    this.elideDirection = options.elideDirection || "right"
    this.wrapText = options.wrapText || false
  }
  readonly font: CellRenderer.ConfigOption<string>
  readonly textColor: CellRenderer.ConfigOption<string>
  readonly backgroundColor: CellRenderer.ConfigOption<string>
  readonly verticalAlignment: CellRenderer.ConfigOption<TextRenderer.VerticalAlignment>
  readonly horizontalAlignment: CellRenderer.ConfigOption<TextRenderer.HorizontalAlignment>
  readonly format: TextRenderer.FormatFunc
  readonly elideDirection: CellRenderer.ConfigOption<TextRenderer.ElideDirection>
  readonly wrapText: CellRenderer.ConfigOption<boolean>
  paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    this.drawBackground(gc, config)
    this.drawText(gc, config)
  }
  drawBackground(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    const color = CellRenderer.resolveOption(this.backgroundColor, config)
    if (!color) {
      return
    }
    gc.fillStyle = color
    gc.fillRect(config.x, config.y, config.width, config.height)
  }
  drawText(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    const font = CellRenderer.resolveOption(this.font, config)
    if (!font) {
      return
    }
    const color = CellRenderer.resolveOption(this.textColor, config)
    if (!color) {
      return
    }
    const format = this.format
    let text = format(config)
    if (!text) {
      return
    }
    const vAlign = CellRenderer.resolveOption(this.verticalAlignment, config)
    const hAlign = CellRenderer.resolveOption(this.horizontalAlignment, config)
    const elideDirection = CellRenderer.resolveOption(
      this.elideDirection,
      config
    )
    const wrapText = CellRenderer.resolveOption(this.wrapText, config)
    const boxHeight = config.height - (vAlign === "center" ? 1 : 2)
    if (boxHeight <= 0) {
      return
    }
    const textHeight = TextRenderer.measureFontHeight(font)
    let textX: number
    let textY: number
    let boxWidth: number
    switch (vAlign) {
      case "top":
        textY = config.y + 2 + textHeight
        break
      case "center":
        textY = config.y + config.height / 2 + textHeight / 2
        break
      case "bottom":
        textY = config.y + config.height - 2
        break
      default:
        throw "unreachable"
    }
    switch (hAlign) {
      case "left":
        textX = config.x + 8
        boxWidth = config.width - 14
        break
      case "center":
        textX = config.x + config.width / 2
        boxWidth = config.width
        break
      case "right":
        textX = config.x + config.width - 8
        boxWidth = config.width - 14
        break
      default:
        throw "unreachable"
    }
    if (textHeight > boxHeight) {
      gc.beginPath()
      gc.rect(config.x, config.y, config.width, config.height - 1)
      gc.clip()
    }
    gc.font = font
    gc.fillStyle = color
    gc.textAlign = hAlign
    gc.textBaseline = "bottom"
    let textWidth = gc.measureText(text).width
    if (wrapText && textWidth > boxWidth) {
      gc.beginPath()
      gc.rect(config.x, config.y, config.width, config.height - 1)
      gc.clip()
      const wordsInColumn = text.split(/\s(?=\b)/)
      let curY = textY
      let textInCurrentLine = wordsInColumn.shift()!
      if (wordsInColumn.length === 0) {
        let curLineTextWidth = gc.measureText(textInCurrentLine).width
        while (curLineTextWidth > boxWidth && textInCurrentLine !== "") {
          for (let i = textInCurrentLine.length; i > 0; i--) {
            const curSubString = textInCurrentLine.substring(0, i)
            const curSubStringWidth = gc.measureText(curSubString).width
            if (curSubStringWidth < boxWidth || curSubString.length === 1) {
              const nextLineText = textInCurrentLine.substring(
                i,
                textInCurrentLine.length
              )
              textInCurrentLine = nextLineText
              curLineTextWidth = gc.measureText(textInCurrentLine).width
              gc.fillText(curSubString, textX, curY)
              curY += textHeight
              break
            }
          }
        }
      } else {
        while (wordsInColumn.length !== 0) {
          const curWord = wordsInColumn.shift()
          const incrementedText = [textInCurrentLine, curWord].join(" ")
          const incrementedTextWidth = gc.measureText(incrementedText).width
          if (incrementedTextWidth > boxWidth) {
            gc.fillText(textInCurrentLine, textX, curY)
            curY += textHeight
            textInCurrentLine = curWord!
          } else {
            textInCurrentLine = incrementedText
          }
        }
      }
      gc.fillText(textInCurrentLine!, textX, curY)
      return
    }
    const elide = "\u2026"
    if (elideDirection === "right") {
      while (textWidth > boxWidth && text.length > 1) {
        if (text.length > 4 && textWidth >= 2 * boxWidth) {
          text = text.substring(0, text.length / 2 + 1) + elide
        } else {
          text = text.substring(0, text.length - 2) + elide
        }
        textWidth = gc.measureText(text).width
      }
    } else {
      while (textWidth > boxWidth && text.length > 1) {
        if (text.length > 4 && textWidth >= 2 * boxWidth) {
          text = elide + text.substring(text.length / 2)
        } else {
          text = elide + text.substring(2)
        }
        textWidth = gc.measureText(text).width
      }
    }
    gc.fillText(text, textX, textY)
  }
}
export namespace TextRenderer {
  export type VerticalAlignment = "top" | "center" | "bottom"
  export type HorizontalAlignment = "left" | "center" | "right"
  export type ElideDirection = "left" | "right"
  export interface IOptions {
    font?: CellRenderer.ConfigOption<string>
    textColor?: CellRenderer.ConfigOption<string>
    backgroundColor?: CellRenderer.ConfigOption<string>
    verticalAlignment?: CellRenderer.ConfigOption<VerticalAlignment>
    horizontalAlignment?: CellRenderer.ConfigOption<HorizontalAlignment>
    format?: FormatFunc
    elideDirection?: CellRenderer.ConfigOption<ElideDirection>
    wrapText?: CellRenderer.ConfigOption<boolean>
  }
  export type FormatFunc = CellRenderer.ConfigFunc<string>
  export function formatGeneric(
    options: formatGeneric.IOptions = {}
  ): FormatFunc {
    const missing = options.missing || ""
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      return String(value)
    }
  }
  export namespace formatGeneric {
    export interface IOptions {
      missing?: string
    }
  }
  export function formatFixed(options: formatFixed.IOptions = {}): FormatFunc {
    const digits = options.digits
    const missing = options.missing || ""
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      return Number(value).toFixed(digits)
    }
  }
  export namespace formatFixed {
    export interface IOptions {
      digits?: number
      missing?: string
    }
  }
  export function formatPrecision(
    options: formatPrecision.IOptions = {}
  ): FormatFunc {
    const digits = options.digits
    const missing = options.missing || ""
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      return Number(value).toPrecision(digits)
    }
  }
  export namespace formatPrecision {
    export interface IOptions {
      digits?: number
      missing?: string
    }
  }
  export function formatExponential(
    options: formatExponential.IOptions = {}
  ): FormatFunc {
    const digits = options.digits
    const missing = options.missing || ""
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      return Number(value).toExponential(digits)
    }
  }
  export namespace formatExponential {
    export interface IOptions {
      digits?: number
      missing?: string
    }
  }
  export function formatIntlNumber(
    options: formatIntlNumber.IOptions = {}
  ): FormatFunc {
    const missing = options.missing || ""
    const nft = new Intl.NumberFormat(options.locales, options.options)
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      return nft.format(value)
    }
  }
  export namespace formatIntlNumber {
    export interface IOptions {
      locales?: string | string[]
      options?: Intl.NumberFormatOptions
      missing?: string
    }
  }
  export function formatDate(options: formatDate.IOptions = {}): FormatFunc {
    const missing = options.missing || ""
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      if (value instanceof Date) {
        return value.toDateString()
      }
      return new Date(value).toDateString()
    }
  }
  export namespace formatDate {
    export interface IOptions {
      missing?: string
    }
  }
  export function formatTime(options: formatTime.IOptions = {}): FormatFunc {
    const missing = options.missing || ""
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      if (value instanceof Date) {
        return value.toTimeString()
      }
      return new Date(value).toTimeString()
    }
  }
  export namespace formatTime {
    export interface IOptions {
      missing?: string
    }
  }
  export function formatISODateTime(
    options: formatISODateTime.IOptions = {}
  ): FormatFunc {
    const missing = options.missing || ""
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      if (value instanceof Date) {
        return value.toISOString()
      }
      return new Date(value).toISOString()
    }
  }
  export namespace formatISODateTime {
    export interface IOptions {
      missing?: string
    }
  }
  export function formatUTCDateTime(
    options: formatUTCDateTime.IOptions = {}
  ): FormatFunc {
    const missing = options.missing || ""
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      if (value instanceof Date) {
        return value.toUTCString()
      }
      return new Date(value).toUTCString()
    }
  }
  export namespace formatUTCDateTime {
    export interface IOptions {
      missing?: string
    }
  }
  export function formatIntlDateTime(
    options: formatIntlDateTime.IOptions = {}
  ): FormatFunc {
    const missing = options.missing || ""
    const dtf = new Intl.DateTimeFormat(options.locales, options.options)
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing
      }
      return dtf.format(value)
    }
  }
  export namespace formatIntlDateTime {
    export interface IOptions {
      locales?: string | string[]
      options?: Intl.DateTimeFormatOptions
      missing?: string
    }
  }
  export function measureFontHeight(font: string): number {
    let height = Private.fontHeightCache[font]
    if (height !== undefined) {
      return height
    }
    Private.fontMeasurementGC.font = font
    const normFont = Private.fontMeasurementGC.font
    Private.fontMeasurementNode.style.font = normFont
    document.body.appendChild(Private.fontMeasurementNode)
    height = Private.fontMeasurementNode.offsetHeight
    document.body.removeChild(Private.fontMeasurementNode)
    Private.fontHeightCache[font] = height
    Private.fontHeightCache[normFont] = height
    return height
  }
}
namespace Private {
  export const fontHeightCache: { [font: string]: number } = Object.create(null)
  export const fontMeasurementNode = (() => {
    const node = document.createElement("div")
    node.style.position = "absolute"
    node.style.top = "-99999px"
    node.style.left = "-99999px"
    node.style.visibility = "hidden"
    node.textContent = "M"
    return node
  })()
  export const fontMeasurementGC = (() => {
    const canvas = document.createElement("canvas")
    canvas.width = 0
    canvas.height = 0
    return canvas.getContext("2d")!
  })()
}
