// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { Platform } from '@lumino/domutils';

import { getKeyboardLayout } from '@lumino/keyboard';

import { DataGrid } from './datagrid';

import { SelectionModel } from './selectionmodel';

import { CellEditor } from './celleditor';

import { MutableDataModel } from './datamodel';

/**
 * A basic implementation of a data grid key handler.
 *
 * #### Notes
 * This class may be subclassed and customized as needed.
 */
export class BasicKeyHandler implements DataGrid.IKeyHandler {
  /**
   * Whether the key handler is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Dispose of the resources held by the key handler.
   */
  dispose(): void {
    this._disposed = true;
  }

  /**
   * Handle the key down event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keydown event of interest.
   *
   * #### Notes
   * This will not be called if the mouse button is pressed.
   */
  onKeyDown(grid: DataGrid, event: KeyboardEvent): void {
    // if grid is editable and cell selection available, start cell editing
    // on key press (letters, numbers and space only)
    if (
      grid.editable &&
      grid.selectionModel!.cursorRow !== -1 &&
      grid.selectionModel!.cursorColumn !== -1
    ) {
      const input = String.fromCharCode(event.keyCode);
      if (/[a-zA-Z0-9-_ ]/.test(input)) {
        const row = grid.selectionModel!.cursorRow;
        const column = grid.selectionModel!.cursorColumn;
        const cell: CellEditor.CellConfig = {
          grid: grid,
          row: row,
          column: column
        };
        grid.editorController!.edit(cell);
        if (getKeyboardLayout().keyForKeydownEvent(event) === 'Space') {
          event.stopPropagation();
          event.preventDefault();
        }
        return;
      }
    }

    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'ArrowLeft':
        this.onArrowLeft(grid, event);
        break;
      case 'ArrowRight':
        this.onArrowRight(grid, event);
        break;
      case 'ArrowUp':
        this.onArrowUp(grid, event);
        break;
      case 'ArrowDown':
        this.onArrowDown(grid, event);
        break;
      case 'PageUp':
        this.onPageUp(grid, event);
        break;
      case 'PageDown':
        this.onPageDown(grid, event);
        break;
      case 'Escape':
        this.onEscape(grid, event);
        break;
      case 'Delete':
        this.onDelete(grid, event);
        break;
      case 'C':
        this.onKeyC(grid, event);
        break;
      case 'Enter':
        if (grid.selectionModel) {
          grid.moveCursor(event.shiftKey ? 'up' : 'down');
          grid.scrollToCursor();
        }
        break;
      case 'Tab':
        if (grid.selectionModel) {
          grid.moveCursor(event.shiftKey ? 'left' : 'right');
          grid.scrollToCursor();
          event.stopPropagation();
          event.preventDefault();
        }
        break;
    }
  }

  /**
   * Handle the `'ArrowLeft'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onArrowLeft(grid: DataGrid, event: KeyboardEvent): void {
    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Fetch the modifier flags.
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // Handle no model with the accel modifier.
    if (!model && accel) {
      grid.scrollTo(0, grid.scrollY);
      return;
    }

    // Handle no model and no modifier. (ignore shift)
    if (!model) {
      grid.scrollByStep('left');
      return;
    }

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Handle the row selection mode with accel key.
    if (mode === 'row' && accel) {
      grid.scrollTo(0, grid.scrollY);
      return;
    }

    // Handle the row selection mode with no modifier. (ignore shift)
    if (mode === 'row') {
      grid.scrollByStep('left');
      return;
    }

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Dispatch based on the modifier keys.
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 - 1 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (accel) {
      r1 = r;
      r2 = r;
      c1 = 0;
      c2 = 0;
      cr = r1;
      cc = c1;
      clear = 'all';
    } else {
      r1 = r;
      r2 = r;
      c1 = c - 1;
      c2 = c - 1;
      cr = r1;
      cc = c1;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift || mode === 'column') {
      grid.scrollToColumn(cs.c2);
    } else {
      grid.scrollToCursor();
    }
  }

  /**
   * Handle the `'ArrowRight'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onArrowRight(grid: DataGrid, event: KeyboardEvent): void {
    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Fetch the modifier flags.
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // Handle no model with the accel modifier.
    if (!model && accel) {
      grid.scrollTo(grid.maxScrollX, grid.scrollY);
      return;
    }

    // Handle no model and no modifier. (ignore shift)
    if (!model) {
      grid.scrollByStep('right');
      return;
    }

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Handle the row selection model with accel key.
    if (mode === 'row' && accel) {
      grid.scrollTo(grid.maxScrollX, grid.scrollY);
      return;
    }

    // Handle the row selection mode with no modifier. (ignore shift)
    if (mode === 'row') {
      grid.scrollByStep('right');
      return;
    }

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Dispatch based on the modifier keys.
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = Infinity;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 + 1 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (accel) {
      r1 = r;
      r2 = r;
      c1 = Infinity;
      c2 = Infinity;
      cr = r1;
      cc = c1;
      clear = 'all';
    } else {
      r1 = r;
      r2 = r;
      c1 = c + 1;
      c2 = c + 1;
      cr = r1;
      cc = c1;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift || mode === 'column') {
      grid.scrollToColumn(cs.c2);
    } else {
      grid.scrollToCursor();
    }
  }

  /**
   * Handle the `'ArrowUp'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onArrowUp(grid: DataGrid, event: KeyboardEvent): void {
    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Fetch the modifier flags.
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // Handle no model with the accel modifier.
    if (!model && accel) {
      grid.scrollTo(grid.scrollX, 0);
      return;
    }

    // Handle no model and no modifier. (ignore shift)
    if (!model) {
      grid.scrollByStep('up');
      return;
    }

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Handle the column selection mode with accel key.
    if (mode === 'column' && accel) {
      grid.scrollTo(grid.scrollX, 0);
      return;
    }

    // Handle the column selection mode with no modifier. (ignore shift)
    if (mode === 'column') {
      grid.scrollByStep('up');
      return;
    }

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Dispatch based on the modifier keys.
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 - 1 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (accel) {
      r1 = 0;
      r2 = 0;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c1;
      clear = 'all';
    } else {
      r1 = r - 1;
      r2 = r - 1;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c1;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift || mode === 'row') {
      grid.scrollToRow(cs.r2);
    } else {
      grid.scrollToCursor();
    }
  }

  /**
   * Handle the `'ArrowDown'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onArrowDown(grid: DataGrid, event: KeyboardEvent): void {
    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Fetch the modifier flags.
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // Handle no model with the accel modifier.
    if (!model && accel) {
      grid.scrollTo(grid.scrollX, grid.maxScrollY);
      return;
    }

    // Handle no model and no modifier. (ignore shift)
    if (!model) {
      grid.scrollByStep('down');
      return;
    }

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Handle the column selection mode with accel key.
    if (mode === 'column' && accel) {
      grid.scrollTo(grid.scrollX, grid.maxScrollY);
      return;
    }

    // Handle the column selection mode with no modifier. (ignore shift)
    if (mode === 'column') {
      grid.scrollByStep('down');
      return;
    }

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Dispatch based on the modifier keys.
    if (accel && shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = Infinity;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (shift) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 + 1 : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else if (accel) {
      r1 = Infinity;
      r2 = Infinity;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c1;
      clear = 'all';
    } else {
      r1 = r + 1;
      r2 = r + 1;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c1;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    if (shift || mode === 'row') {
      grid.scrollToRow(cs.r2);
    } else {
      grid.scrollToCursor();
    }
  }

  /**
   * Handle the `'PageUp'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onPageUp(grid: DataGrid, event: KeyboardEvent): void {
    // Ignore the event if the accel key is pressed.
    if (Platform.accelKey(event)) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Scroll by page if there is no selection model.
    if (!model || model.selectionMode === 'column') {
      grid.scrollByPage('up');
      return;
    }

    // Get the normal number of cells in the page height.
    let n = Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight);

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Select or resize as needed.
    if (event.shiftKey) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 - n : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else {
      r1 = cs ? cs.r1 - n : 0;
      r2 = r1;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    grid.scrollToRow(cs.r2);
  }

  /**
   * Handle the `'PageDown'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onPageDown(grid: DataGrid, event: KeyboardEvent): void {
    // Ignore the event if the accel key is pressed.
    if (Platform.accelKey(event)) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Scroll by page if there is no selection model.
    if (!model || model.selectionMode === 'column') {
      grid.scrollByPage('down');
      return;
    }

    // Get the normal number of cells in the page height.
    let n = Math.floor(grid.pageHeight / grid.defaultSizes.rowHeight);

    // Fetch the cursor and selection.
    let r = model.cursorRow;
    let c = model.cursorColumn;
    let cs = model.currentSelection();

    // Set up the selection variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;
    let cr: number;
    let cc: number;
    let clear: SelectionModel.ClearMode;

    // Select or resize as needed.
    if (event.shiftKey) {
      r1 = cs ? cs.r1 : 0;
      r2 = cs ? cs.r2 + n : 0;
      c1 = cs ? cs.c1 : 0;
      c2 = cs ? cs.c2 : 0;
      cr = r;
      cc = c;
      clear = 'current';
    } else {
      r1 = cs ? cs.r1 + n : 0;
      r2 = r1;
      c1 = c;
      c2 = c;
      cr = r1;
      cc = c;
      clear = 'all';
    }

    // Create the new selection.
    model.select({ r1, c1, r2, c2, cursorRow: cr, cursorColumn: cc, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid appropriately.
    grid.scrollToRow(cs.r2);
  }

  /**
   * Handle the `'Escape'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onEscape(grid: DataGrid, event: KeyboardEvent): void {
    if (grid.selectionModel) {
      grid.selectionModel.clear();
    }
  }

  /**
   * Handle the `'Delete'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onDelete(grid: DataGrid, event: KeyboardEvent): void {
    if (grid.editable && !grid.selectionModel!.isEmpty) {
      const dataModel = grid.dataModel as MutableDataModel;
      // Fetch the max row and column.
      let maxRow = dataModel.rowCount('body') - 1;
      let maxColumn = dataModel.columnCount('body') - 1;

      for (let s of grid.selectionModel!.selections()) {
        // Clamp the cell to the model bounds.
        let sr1 = Math.max(0, Math.min(s.r1, maxRow));
        let sc1 = Math.max(0, Math.min(s.c1, maxColumn));
        let sr2 = Math.max(0, Math.min(s.r2, maxRow));
        let sc2 = Math.max(0, Math.min(s.c2, maxColumn));

        for (let r = sr1; r <= sr2; ++r) {
          for (let c = sc1; c <= sc2; ++c) {
            dataModel.setData('body', r, c, null);
          }
        }
      }
    }
  }

  /**
   * Handle the `'C'` key press for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  protected onKeyC(grid: DataGrid, event: KeyboardEvent): void {
    // Bail early if the modifiers aren't correct for copy.
    if (event.shiftKey || !Platform.accelKey(event)) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Copy the current selection to the clipboard.
    grid.copyToClipboard();
  }

  private _disposed = false;
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { IDisposable } from '@lumino/disposable';

import { Platform } from '@lumino/domutils';

import { Drag } from '@lumino/dragdrop';

import { DataGrid } from './datagrid';

import { HyperlinkRenderer } from './hyperlinkrenderer';

import { DataModel } from './datamodel';

import { SelectionModel } from './selectionmodel';

import { CellEditor } from './celleditor';

import { CellGroup } from './cellgroup';

import { CellRenderer } from './cellrenderer';

import { TextRenderer } from './textrenderer';

/**
 * A basic implementation of a data grid mouse handler.
 *
 * #### Notes
 * This class may be subclassed and customized as needed.
 */
export class BasicMouseHandler implements DataGrid.IMouseHandler {
  /**
   * Dispose of the resources held by the mouse handler.
   */
  dispose(): void {
    // Bail early if the handler is already disposed.
    if (this._disposed) {
      return;
    }

    // Release any held resources.
    this.release();

    // Mark the handler as disposed.
    this._disposed = true;
  }

  /**
   * Whether the mouse handler is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Release the resources held by the handler.
   */
  release(): void {
    // Bail early if the is no press data.
    if (!this._pressData) {
      return;
    }

    // Clear the autoselect timeout.
    if (this._pressData.type === 'select') {
      this._pressData.timeout = -1;
    }

    // Clear the press data.
    this._pressData.override.dispose();
    this._pressData = null;
  }

  /**
   * Handle the mouse hover event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse hover event of interest.
   */
  onMouseHover(grid: DataGrid, event: MouseEvent): void {
    // Hit test the grid.
    let hit = grid.hitTest(event.clientX, event.clientY);

    // Get the resize handle for the hit test.
    let handle = Private.resizeHandleForHitTest(hit);

    // Fetch the cursor for the handle.
    let cursor = this.cursorForHandle(handle);

    // Hyperlink logic.
    const config = Private.createCellConfigObject(grid, hit);

    if (config) {
      // Retrieve renderer for hovered cell.
      const renderer = grid.cellRenderers.get(config);
      if (renderer instanceof HyperlinkRenderer) {
        cursor = this.cursorForHandle('hyperlink');
      }
    }

    // Update the viewport cursor based on the part.
    grid.viewport.node.style.cursor = cursor;

    // TODO support user-defined hover items
  }

  /**
   * Handle the mouse leave event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse hover event of interest.
   */
  onMouseLeave(grid: DataGrid, event: MouseEvent): void {
    // TODO support user-defined hover popups.

    // Clear the viewport cursor.
    grid.viewport.node.style.cursor = '';
  }

  /**
   * Handle the mouse down event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse down event of interest.
   */
  onMouseDown(grid: DataGrid, event: MouseEvent): void {
    // Unpack the event.
    let { clientX, clientY } = event;

    // Hit test the grid.
    let hit = grid.hitTest(clientX, clientY);

    // Unpack the hit test.
    const { region, row, column } = hit;

    // Bail if the hit test is on an uninteresting region.
    if (region === 'void') {
      return;
    }

    // Fetch the modifier flags.
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // Hyperlink logic.
    if (grid) {
      // Create cell config object.
      const config = Private.createCellConfigObject(grid, hit);

      // Retrieve cell renderer.
      let renderer = grid.cellRenderers.get(config!);

      // Only process hyperlink renderers.
      if (renderer instanceof HyperlinkRenderer) {
        // Use the url param if it exists.
        let url = CellRenderer.resolveOption(renderer.url, config!);
        // Otherwise assume cell value is the URL.
        if (!url) {
          const format = TextRenderer.formatGeneric();
          url = format(config!);
        }

        // Open the hyperlink only if user hit Ctrl+Click.
        if (accel) {
          window.open(url);
          // Reset cursor default after clicking
          const cursor = this.cursorForHandle('none');
          grid.viewport.node.style.cursor = cursor;
          // Not applying selections if navigating away.
          return;
        }
      }
    }

    // If the hit test is the body region, the only option is select.
    if (region === 'body') {
      // Fetch the selection model.
      let model = grid.selectionModel;

      // Bail early if there is no selection model.
      if (!model) {
        return;
      }

      // Override the document cursor.
      let override = Drag.overrideCursor('default');

      // Set up the press data.
      this._pressData = {
        type: 'select',
        region,
        row,
        column,
        override,
        localX: -1,
        localY: -1,
        timeout: -1
      };

      // Set up the selection variables.
      let r1: number;
      let c1: number;
      let r2: number;
      let c2: number;
      let cursorRow: number;
      let cursorColumn: number;
      let clear: SelectionModel.ClearMode;

      // Accel == new selection, keep old selections.
      if (accel) {
        r1 = row;
        r2 = row;
        c1 = column;
        c2 = column;
        cursorRow = row;
        cursorColumn = column;
        clear = 'none';
      } else if (shift) {
        r1 = model.cursorRow;
        r2 = row;
        c1 = model.cursorColumn;
        c2 = column;
        cursorRow = model.cursorRow;
        cursorColumn = model.cursorColumn;
        clear = 'current';
      } else {
        r1 = row;
        r2 = row;
        c1 = column;
        c2 = column;
        cursorRow = row;
        cursorColumn = column;
        clear = 'all';
      }

      // Make the selection.
      model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear });

      // Done.
      return;
    }

    // Otherwise, the hit test is on a header region.

    // Convert the hit test into a part.
    let handle = Private.resizeHandleForHitTest(hit);

    // Fetch the cursor for the handle.
    let cursor = this.cursorForHandle(handle);

    // Handle horizontal resize.
    if (handle === 'left' || handle === 'right') {
      // Set up the resize data type.
      const type = 'column-resize';

      // Determine the column region.
      let rgn: DataModel.ColumnRegion =
        region === 'column-header' ? 'body' : 'row-header';

      // Determine the section index.
      let index = handle === 'left' ? column - 1 : column;

      // Fetch the section size.
      let size = grid.columnSize(rgn, index);

      // Override the document cursor.
      let override = Drag.overrideCursor(cursor);

      // Create the temporary press data.
      this._pressData = { type, region: rgn, index, size, clientX, override };

      // Done.
      return;
    }

    // Handle vertical resize
    if (handle === 'top' || handle === 'bottom') {
      // Set up the resize data type.
      const type = 'row-resize';

      // Determine the row region.
      let rgn: DataModel.RowRegion =
        region === 'row-header' ? 'body' : 'column-header';

      // Determine the section index.
      let index = handle === 'top' ? row - 1 : row;

      // Fetch the section size.
      let size = grid.rowSize(rgn, index);

      // Override the document cursor.
      let override = Drag.overrideCursor(cursor);

      // Create the temporary press data.
      this._pressData = { type, region: rgn, index, size, clientY, override };

      // Done.
      return;
    }

    // Otherwise, the only option is select.

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Bail if there is no selection model.
    if (!model) {
      return;
    }

    // Override the document cursor.
    let override = Drag.overrideCursor('default');

    // Set up the press data.
    this._pressData = {
      type: 'select',
      region,
      row,
      column,
      override,
      localX: -1,
      localY: -1,
      timeout: -1
    };

    // Set up the selection variables.
    let r1: number;
    let c1: number;
    let r2: number;
    let c2: number;
    let cursorRow: number;
    let cursorColumn: number;
    let clear: SelectionModel.ClearMode;

    // Compute the selection based on the pressed region.
    if (region === 'corner-header') {
      r1 = 0;
      r2 = Infinity;
      c1 = 0;
      c2 = Infinity;
      cursorRow = accel ? 0 : shift ? model.cursorRow : 0;
      cursorColumn = accel ? 0 : shift ? model.cursorColumn : 0;
      clear = accel ? 'none' : shift ? 'current' : 'all';
    } else if (region === 'row-header') {
      r1 = accel ? row : shift ? model.cursorRow : row;
      r2 = row;

      const selectionGroup: CellGroup = { r1: r1, c1: 0, r2: r2, c2: 0 };
      const joinedGroup = CellGroup.joinCellGroupsIntersectingAtAxis(
        grid.dataModel!,
        ['row-header', 'body'],
        'row',
        selectionGroup
      );
      // Check if there are any merges
      if (joinedGroup.r1 != Number.MAX_VALUE) {
        r1 = joinedGroup.r1;
        r2 = joinedGroup.r2;
      }

      c1 = 0;
      c2 = Infinity;
      cursorRow = accel ? row : shift ? model.cursorRow : row;
      cursorColumn = accel ? 0 : shift ? model.cursorColumn : 0;
      clear = accel ? 'none' : shift ? 'current' : 'all';
    } else if (region === 'column-header') {
      r1 = 0;
      r2 = Infinity;
      c1 = accel ? column : shift ? model.cursorColumn : column;
      c2 = column;

      const selectionGroup: CellGroup = { r1: 0, c1: c1, r2: 0, c2: c2 };
      const joinedGroup = CellGroup.joinCellGroupsIntersectingAtAxis(
        grid.dataModel!,
        ['column-header', 'body'],
        'column',
        selectionGroup
      );
      // Check if there are any merges
      if (joinedGroup.c1 != Number.MAX_VALUE) {
        c1 = joinedGroup.c1;
        c2 = joinedGroup.c2;
      }

      cursorRow = accel ? 0 : shift ? model.cursorRow : 0;
      cursorColumn = accel ? column : shift ? model.cursorColumn : column;
      clear = accel ? 'none' : shift ? 'current' : 'all';
    } else {
      r1 = accel ? row : shift ? model.cursorRow : row;
      r2 = row;
      c1 = accel ? column : shift ? model.cursorColumn : column;
      c2 = column;
      cursorRow = accel ? row : shift ? model.cursorRow : row;
      cursorColumn = accel ? column : shift ? model.cursorColumn : column;
      clear = accel ? 'none' : shift ? 'current' : 'all';
    }

    // Make the selection.
    model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear });
  }

  /**
   * Handle the mouse move event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse move event of interest.
   */
  onMouseMove(grid: DataGrid, event: MouseEvent): void {
    // Fetch the press data.
    const data = this._pressData;

    // Bail early if there is no press data.
    if (!data) {
      return;
    }

    // Handle a row resize.
    if (data.type === 'row-resize') {
      let dy = event.clientY - data.clientY;
      grid.resizeRow(data.region, data.index, data.size + dy);
      return;
    }

    // Handle a column resize.
    if (data.type === 'column-resize') {
      let dx = event.clientX - data.clientX;
      grid.resizeColumn(data.region, data.index, data.size + dx);
      return;
    }

    // Otherwise, it's a select.

    // Mouse moves during a corner header press are a no-op.
    if (data.region === 'corner-header') {
      return;
    }

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Bail early if the selection model was removed.
    if (!model) {
      return;
    }

    // Map to local coordinates.
    let { lx, ly } = grid.mapToLocal(event.clientX, event.clientY);

    // Update the local mouse coordinates in the press data.
    data.localX = lx;
    data.localY = ly;

    // Fetch the grid geometry.
    let hw = grid.headerWidth;
    let hh = grid.headerHeight;
    let vpw = grid.viewportWidth;
    let vph = grid.viewportHeight;
    let sx = grid.scrollX;
    let sy = grid.scrollY;
    let msx = grid.maxScrollY;
    let msy = grid.maxScrollY;

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Set up the timeout variable.
    let timeout = -1;

    // Compute the timemout based on hit region and mouse position.
    if (data.region === 'row-header' || mode === 'row') {
      if (ly < hh && sy > 0) {
        timeout = Private.computeTimeout(hh - ly);
      } else if (ly >= vph && sy < msy) {
        timeout = Private.computeTimeout(ly - vph);
      }
    } else if (data.region === 'column-header' || mode === 'column') {
      if (lx < hw && sx > 0) {
        timeout = Private.computeTimeout(hw - lx);
      } else if (lx >= vpw && sx < msx) {
        timeout = Private.computeTimeout(lx - vpw);
      }
    } else {
      if (lx < hw && sx > 0) {
        timeout = Private.computeTimeout(hw - lx);
      } else if (lx >= vpw && sx < msx) {
        timeout = Private.computeTimeout(lx - vpw);
      } else if (ly < hh && sy > 0) {
        timeout = Private.computeTimeout(hh - ly);
      } else if (ly >= vph && sy < msy) {
        timeout = Private.computeTimeout(ly - vph);
      }
    }

    // Update or initiate the autoselect if needed.
    if (timeout >= 0) {
      if (data.timeout < 0) {
        data.timeout = timeout;
        setTimeout(() => {
          Private.autoselect(grid, data);
        }, timeout);
      } else {
        data.timeout = timeout;
      }
      return;
    }

    // Otherwise, clear the autoselect timeout.
    data.timeout = -1;

    // Map the position to virtual coordinates.
    let { vx, vy } = grid.mapToVirtual(event.clientX, event.clientY);

    // Clamp the coordinates to the limits.
    vx = Math.max(0, Math.min(vx, grid.bodyWidth - 1));
    vy = Math.max(0, Math.min(vy, grid.bodyHeight - 1));

    // Set up the selection variables.
    let r1: number;
    let c1: number;
    let r2: number;
    let c2: number;
    let cursorRow = model.cursorRow;
    let cursorColumn = model.cursorColumn;
    let clear: SelectionModel.ClearMode = 'current';

    // Compute the selection based pressed region.
    if (data.region === 'row-header' || mode === 'row') {
      r1 = data.row;
      r2 = grid.rowAt('body', vy);

      const selectionGroup: CellGroup = { r1: r1, c1: 0, r2: r2, c2: 0 };
      const joinedGroup = CellGroup.joinCellGroupsIntersectingAtAxis(
        grid.dataModel!,
        ['row-header', 'body'],
        'row',
        selectionGroup
      );
      // Check if there are any merges
      if (joinedGroup.r1 != Number.MAX_VALUE) {
        r1 = Math.min(r1, joinedGroup.r1);
        r2 = Math.max(r2, joinedGroup.r2);
      }

      c1 = 0;
      c2 = Infinity;
    } else if (data.region === 'column-header' || mode === 'column') {
      r1 = 0;
      r2 = Infinity;
      c1 = data.column;
      c2 = grid.columnAt('body', vx);

      const selectionGroup: CellGroup = { r1: 0, c1: c1, r2: 0, c2: c2 };
      const joinedGroup = CellGroup.joinCellGroupsIntersectingAtAxis(
        grid.dataModel!,
        ['column-header', 'body'],
        'column',
        selectionGroup
      );
      // Check if there are any merges
      if (joinedGroup.c1 != Number.MAX_VALUE) {
        c1 = joinedGroup.c1;
        c2 = joinedGroup.c2;
      }
    } else {
      r1 = cursorRow;
      r2 = grid.rowAt('body', vy);
      c1 = cursorColumn;
      c2 = grid.columnAt('body', vx);
    }

    // Make the selection.
    model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear });
  }

  /**
   * Handle the mouse up event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse up event of interest.
   */
  onMouseUp(grid: DataGrid, event: MouseEvent): void {
    this.release();
  }

  /**
   * Handle the mouse double click event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse up event of interest.
   */
  onMouseDoubleClick(grid: DataGrid, event: MouseEvent): void {
    if (!grid.dataModel) {
      this.release();
      return;
    }

    // Unpack the event.
    let { clientX, clientY } = event;

    // Hit test the grid.
    let hit = grid.hitTest(clientX, clientY);

    // Unpack the hit test.
    let { region, row, column } = hit;

    if (region === 'void') {
      this.release();
      return;
    }

    if (region === 'body') {
      if (grid.editable) {
        const cell: CellEditor.CellConfig = {
          grid: grid,
          row: row,
          column: column
        };
        grid.editorController!.edit(cell);
      }
    }

    this.release();
  }

  /**
   * Handle the context menu event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The context menu event of interest.
   */
  onContextMenu(grid: DataGrid, event: MouseEvent): void {
    // TODO support user-defined context menus
  }

  /**
   * Handle the wheel event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The wheel event of interest.
   */
  onWheel(grid: DataGrid, event: WheelEvent): void {
    // Bail if a mouse press is in progress.
    if (this._pressData) {
      return;
    }

    // Extract the delta X and Y movement.
    let dx = event.deltaX;
    let dy = event.deltaY;

    // Convert the delta values to pixel values.
    switch (event.deltaMode) {
      case 0: // DOM_DELTA_PIXEL
        break;
      case 1: {
        // DOM_DELTA_LINE
        let ds = grid.defaultSizes;
        dx *= ds.columnWidth;
        dy *= ds.rowHeight;
        break;
      }
      case 2: // DOM_DELTA_PAGE
        dx *= grid.pageWidth;
        dy *= grid.pageHeight;
        break;
      default:
        throw 'unreachable';
    }

    // Scroll by the desired amount.
    grid.scrollBy(dx, dy);
  }

  /**
   * Convert a resize handle into a cursor.
   */
  cursorForHandle(handle: ResizeHandle): string {
    return Private.cursorMap[handle];
  }

  /**
   * Get the current pressData
   */
  get pressData(): PressData.PressData | null {
    return this._pressData;
  }

  private _disposed = false;
  protected _pressData: PressData.PressData | null = null;
}

/**
 * A type alias for the resize handle types.
 */
export type ResizeHandle =
  | 'top'
  | 'left'
  | 'right'
  | 'bottom'
  | 'none'
  | 'hyperlink';

/**
 * The namespace for the pressdata.
 */
export namespace PressData {
  /**
   * A type alias for the row resize data.
   */
  export type RowResizeData = {
    /**
     * The descriminated type for the data.
     */
    readonly type: 'row-resize';

    /**
     * The row region which holds the section being resized.
     */
    readonly region: DataModel.RowRegion;

    /**
     * The index of the section being resized.
     */
    readonly index: number;

    /**
     * The original size of the section.
     */
    readonly size: number;

    /**
     * The original client Y position of the mouse.
     */
    readonly clientY: number;

    /**
     * The disposable to clear the cursor override.
     */
    readonly override: IDisposable;
  };

  /**
   * A type alias for the column resize data.
   */
  export type ColumnResizeData = {
    /**
     * The descriminated type for the data.
     */
    readonly type: 'column-resize';

    /**
     * The column region which holds the section being resized.
     */
    readonly region: DataModel.ColumnRegion;

    /**
     * The index of the section being resized.
     */
    readonly index: number;

    /**
     * The original size of the section.
     */
    readonly size: number;

    /**
     * The original client X position of the mouse.
     */
    readonly clientX: number;

    /**
     * The disposable to clear the cursor override.
     */
    readonly override: IDisposable;
  };

  /**
   * A type alias for the select data.
   */
  export type SelectData = {
    /**
     * The descriminated type for the data.
     */
    readonly type: 'select';

    /**
     * The original region for the mouse press.
     */
    readonly region: DataModel.CellRegion;

    /**
     * The original row that was selected.
     */
    readonly row: number;

    /**
     * The original column that was selected.
     */
    readonly column: number;

    /**
     * The disposable to clear the cursor override.
     */
    readonly override: IDisposable;

    /**
     * The current local X position of the mouse.
     */
    localX: number;

    /**
     * The current local Y position of the mouse.
     */
    localY: number;

    /**
     * The timeout delay for the autoselect loop.
     */
    timeout: number;
  };

  /**
   * A type alias for the resize handler press data.
   */
  export type PressData = RowResizeData | ColumnResizeData | SelectData;
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Creates a CellConfig object from a hit region.
   */
  export function createCellConfigObject(
    grid: DataGrid,
    hit: DataGrid.HitTestResult
  ): CellRenderer.CellConfig | undefined {
    const { region, row, column } = hit;

    // Terminate call if region is void.
    if (region === 'void') {
      return undefined;
    }

    // Augment hit region params with value and metadata.
    const value = grid.dataModel!.data(region, row, column);
    const metadata = grid.dataModel!.metadata(region, row, column);

    // Create cell config object to retrieve cell renderer.
    const config = {
      ...hit,
      value: value,
      metadata: metadata
    } as CellRenderer.CellConfig;

    return config;
  }

  /**
   * Get the resize handle for a grid hit test.
   */
  export function resizeHandleForHitTest(
    hit: DataGrid.HitTestResult
  ): ResizeHandle {
    // Fetch the row and column.
    let r = hit.row;
    let c = hit.column;

    // Fetch the leading and trailing sizes.
    let lw = hit.x;
    let lh = hit.y;
    let tw = hit.width - hit.x;
    let th = hit.height - hit.y;

    // Set up the result variable.
    let result: ResizeHandle;

    // Dispatch based on hit test region.
    switch (hit.region) {
      case 'corner-header':
        if (c > 0 && lw <= 5) {
          result = 'left';
        } else if (tw <= 6) {
          result = 'right';
        } else if (r > 0 && lh <= 5) {
          result = 'top';
        } else if (th <= 6) {
          result = 'bottom';
        } else {
          result = 'none';
        }
        break;
      case 'column-header':
        if (c > 0 && lw <= 5) {
          result = 'left';
        } else if (tw <= 6) {
          result = 'right';
        } else if (r > 0 && lh <= 5) {
          result = 'top';
        } else if (th <= 6) {
          result = 'bottom';
        } else {
          result = 'none';
        }
        break;
      case 'row-header':
        if (c > 0 && lw <= 5) {
          result = 'left';
        } else if (tw <= 6) {
          result = 'right';
        } else if (r > 0 && lh <= 5) {
          result = 'top';
        } else if (th <= 6) {
          result = 'bottom';
        } else {
          result = 'none';
        }
        break;
      case 'body':
        result = 'none';
        break;
      case 'void':
        result = 'none';
        break;
      default:
        throw 'unreachable';
    }

    // Return the result.
    return result;
  }

  /**
   * A timer callback for the autoselect loop.
   *
   * @param grid - The datagrid of interest.
   *
   * @param data - The select data of interest.
   */
  export function autoselect(grid: DataGrid, data: PressData.SelectData): void {
    // Bail early if the timeout has been reset.
    if (data.timeout < 0) {
      return;
    }

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Bail early if the selection model has been removed.
    if (!model) {
      return;
    }

    // Fetch the current selection.
    let cs = model.currentSelection();

    // Bail early if there is no current selection.
    if (!cs) {
      return;
    }

    // Fetch local X and Y coordinates of the mouse.
    let lx = data.localX;
    let ly = data.localY;

    // Set up the selection variables.
    let r1 = cs.r1;
    let c1 = cs.c1;
    let r2 = cs.r2;
    let c2 = cs.c2;
    let cursorRow = model.cursorRow;
    let cursorColumn = model.cursorColumn;
    let clear: SelectionModel.ClearMode = 'current';

    // Fetch the grid geometry.
    let hw = grid.headerWidth;
    let hh = grid.headerHeight;
    let vpw = grid.viewportWidth;
    let vph = grid.viewportHeight;

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Update the selection based on the hit region.
    if (data.region === 'row-header' || mode === 'row') {
      r2 += ly <= hh ? -1 : ly >= vph ? 1 : 0;
    } else if (data.region === 'column-header' || mode === 'column') {
      c2 += lx <= hw ? -1 : lx >= vpw ? 1 : 0;
    } else {
      r2 += ly <= hh ? -1 : ly >= vph ? 1 : 0;
      c2 += lx <= hw ? -1 : lx >= vpw ? 1 : 0;
    }

    // Update the current selection.
    model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return;
    }

    // Scroll the grid based on the hit region.
    if (data.region === 'row-header' || mode === 'row') {
      grid.scrollToRow(cs.r2);
    } else if (data.region === 'column-header' || mode == 'column') {
      grid.scrollToColumn(cs.c2);
    } else if (mode === 'cell') {
      grid.scrollToCell(cs.r2, cs.c2);
    }

    // Schedule the next call with the current timeout.
    setTimeout(() => {
      autoselect(grid, data);
    }, data.timeout);
  }

  /**
   * Compute the scroll timeout for the given delta distance.
   *
   * @param delta - The delta pixels from the origin.
   *
   * @returns The scaled timeout in milliseconds.
   */
  export function computeTimeout(delta: number): number {
    return 5 + 120 * (1 - Math.min(128, Math.abs(delta)) / 128);
  }

  /**
   * A mapping of resize handle to cursor.
   */
  export const cursorMap = {
    top: 'ns-resize',
    left: 'ew-resize',
    right: 'ew-resize',
    bottom: 'ns-resize',
    hyperlink: 'pointer',
    none: 'default'
  };
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { DataModel } from './datamodel';

import { SelectionModel } from './selectionmodel';

/**
 * A basic selection model implementation.
 *
 * #### Notes
 * This selection model is sufficient for most use cases where
 * structural knowledge of the data source is *not* required.
 */
export class BasicSelectionModel extends SelectionModel {
  /**
   * Whether the selection model is empty.
   */
  get isEmpty(): boolean {
    return this._selections.length === 0;
  }

  /**
   * The row index of the cursor.
   */
  get cursorRow(): number {
    return this._cursorRow;
  }

  /**
   * The column index of the cursor.
   */
  get cursorColumn(): number {
    return this._cursorColumn;
  }

  /**
   * Move cursor down/up/left/right while making sure it remains
   * within the bounds of selected rectangles
   *
   * @param direction - The direction of the movement.
   */
  moveCursorWithinSelections(
    direction: SelectionModel.CursorMoveDirection
  ): void {
    // Bail early if there are no selections or no existing cursor
    if (this.isEmpty || this.cursorRow === -1 || this._cursorColumn === -1) {
      return;
    }

    // Bail early if only single cell is selected
    const firstSelection = this._selections[0];
    if (
      this._selections.length === 1 &&
      firstSelection.r1 === firstSelection.r2 &&
      firstSelection.c1 === firstSelection.c2
    ) {
      return;
    }

    // start from last selection rectangle
    if (this._cursorRectIndex === -1) {
      this._cursorRectIndex = this._selections.length - 1;
    }

    let cursorRect = this._selections[this._cursorRectIndex];
    const dr = direction === 'down' ? 1 : direction === 'up' ? -1 : 0;
    const dc = direction === 'right' ? 1 : direction === 'left' ? -1 : 0;
    let newRow = this._cursorRow + dr;
    let newColumn = this._cursorColumn + dc;
    const r1 = Math.min(cursorRect.r1, cursorRect.r2);
    const r2 = Math.max(cursorRect.r1, cursorRect.r2);
    const c1 = Math.min(cursorRect.c1, cursorRect.c2);
    const c2 = Math.max(cursorRect.c1, cursorRect.c2);

    const moveToNextRect = () => {
      this._cursorRectIndex =
        (this._cursorRectIndex + 1) % this._selections.length;
      cursorRect = this._selections[this._cursorRectIndex];
      newRow = Math.min(cursorRect.r1, cursorRect.r2);
      newColumn = Math.min(cursorRect.c1, cursorRect.c2);
    };

    const moveToPreviousRect = () => {
      this._cursorRectIndex =
        this._cursorRectIndex === 0
          ? this._selections.length - 1
          : this._cursorRectIndex - 1;
      cursorRect = this._selections[this._cursorRectIndex];
      newRow = Math.max(cursorRect.r1, cursorRect.r2);
      newColumn = Math.max(cursorRect.c1, cursorRect.c2);
    };

    if (newRow > r2) {
      newRow = r1;
      newColumn += 1;
      if (newColumn > c2) {
        moveToNextRect();
      }
    } else if (newRow < r1) {
      newRow = r2;
      newColumn -= 1;
      if (newColumn < c1) {
        moveToPreviousRect();
      }
    } else if (newColumn > c2) {
      newColumn = c1;
      newRow += 1;
      if (newRow > r2) {
        moveToNextRect();
      }
    } else if (newColumn < c1) {
      newColumn = c2;
      newRow -= 1;
      if (newRow < r1) {
        moveToPreviousRect();
      }
    }

    this._cursorRow = newRow;
    this._cursorColumn = newColumn;

    // Emit the changed signal.
    this.emitChanged();
  }

  /**
   * Get the current selection in the selection model.
   *
   * @returns The current selection or `null`.
   *
   * #### Notes
   * This is the selection which holds the cursor.
   */
  currentSelection(): SelectionModel.Selection | null {
    return this._selections[this._selections.length - 1] || null;
  }

  /**
   * Get an iterator of the selections in the model.
   *
   * @returns A new iterator of the current selections.
   *
   * #### Notes
   * The data grid will render the selections in order.
   */
  *selections(): IterableIterator<SelectionModel.Selection> {
    yield* this._selections;
  }

  /**
   * Select the specified cells.
   *
   * @param args - The arguments for the selection.
   */
  select(args: SelectionModel.SelectArgs): void {
    // Fetch the current row and column counts;
    let rowCount = this.dataModel.rowCount('body');
    let columnCount = this.dataModel.columnCount('body');

    // Bail early if there is no content.
    if (rowCount <= 0 || columnCount <= 0) {
      return;
    }

    // Unpack the arguments.
    let { r1, c1, r2, c2, cursorRow, cursorColumn, clear } = args;

    // Clear the necessary selections.
    if (clear === 'all') {
      this._selections.length = 0;
    } else if (clear === 'current') {
      this._selections.pop();
    }

    // Clamp to the data model bounds.
    r1 = Math.max(0, Math.min(r1, rowCount - 1));
    r2 = Math.max(0, Math.min(r2, rowCount - 1));
    c1 = Math.max(0, Math.min(c1, columnCount - 1));
    c2 = Math.max(0, Math.min(c2, columnCount - 1));

    // Indicate if a row/column has already been selected.
    let alreadySelected = false;

    // Handle the selection mode.
    if (this.selectionMode === 'row') {
      c1 = 0;
      c2 = columnCount - 1;
      alreadySelected =
        this._selections.filter(selection => selection.r1 === r1).length !== 0;
      // Remove from selections if already selected.
      this._selections = alreadySelected
        ? this._selections.filter(selection => selection.r1 !== r1)
        : this._selections;
    } else if (this.selectionMode === 'column') {
      r1 = 0;
      r2 = rowCount - 1;
      alreadySelected =
        this._selections.filter(selection => selection.c1 === c1).length !== 0;
      // Remove from selections if already selected.
      this._selections = alreadySelected
        ? this._selections.filter(selection => selection.c1 !== c1)
        : this._selections;
    }

    // Alias the cursor row and column.
    let cr = cursorRow;
    let cc = cursorColumn;

    // Compute the new cursor location.
    if (cr < 0 || (cr < r1 && cr < r2) || (cr > r1 && cr > r2)) {
      cr = r1;
    }
    if (cc < 0 || (cc < c1 && cc < c2) || (cc > c1 && cc > c2)) {
      cc = c1;
    }

    // Update the cursor.
    this._cursorRow = cr;
    this._cursorColumn = cc;
    this._cursorRectIndex = this._selections.length;

    // Add the new selection if it wasn't already selected.
    if (!alreadySelected) {
      this._selections.push({ r1, c1, r2, c2 });
    }

    // Emit the changed signal.
    this.emitChanged();
  }

  /**
   * Clear all selections in the selection model.
   */
  clear(): void {
    // Bail early if there are no selections.
    if (this._selections.length === 0) {
      return;
    }

    // Reset the internal state.
    this._cursorRow = -1;
    this._cursorColumn = -1;
    this._cursorRectIndex = -1;
    this._selections.length = 0;

    // Emit the changed signal.
    this.emitChanged();
  }

  /**
   * A signal handler for the data model `changed` signal.
   *
   * @param args - The arguments for the signal.
   */
  protected onDataModelChanged(
    sender: DataModel,
    args: DataModel.ChangedArgs
  ): void {
    // Bail early if the model has no current selections.
    if (this._selections.length === 0) {
      return;
    }

    // Bail early if the cells have changed in place.
    if (args.type === 'cells-changed') {
      return;
    }

    // Bail early if there is no change to the row or column count.
    if (args.type === 'rows-moved' || args.type === 'columns-moved') {
      return;
    }

    // Fetch the last row and column index.
    let lr = sender.rowCount('body') - 1;
    let lc = sender.columnCount('body') - 1;

    // Bail early if the data model is empty.
    if (lr < 0 || lc < 0) {
      this._selections.length = 0;
      this.emitChanged();
      return;
    }

    // Fetch the selection mode.
    let mode = this.selectionMode;

    // Set up the assignment index variable.
    let j = 0;

    // Iterate over the current selections.
    for (let i = 0, n = this._selections.length; i < n; ++i) {
      // Unpack the selection.
      let { r1, c1, r2, c2 } = this._selections[i];

      // Skip the selection if it will disappear.
      if ((lr < r1 && lr < r2) || (lc < c1 && lc < c2)) {
        continue;
      }

      // Modify the bounds based on the selection mode.
      if (mode === 'row') {
        r1 = Math.max(0, Math.min(r1, lr));
        r2 = Math.max(0, Math.min(r2, lr));
        c1 = 0;
        c2 = lc;
      } else if (mode === 'column') {
        r1 = 0;
        r2 = lr;
        c1 = Math.max(0, Math.min(c1, lc));
        c2 = Math.max(0, Math.min(c2, lc));
      } else {
        r1 = Math.max(0, Math.min(r1, lr));
        r2 = Math.max(0, Math.min(r2, lr));
        c1 = Math.max(0, Math.min(c1, lc));
        c2 = Math.max(0, Math.min(c2, lc));
      }

      // Assign the modified selection to the array.
      this._selections[j++] = { r1, c1, r2, c2 };
    }

    // Remove the stale selections.
    this._selections.length = j;

    // Emit the changed signal.
    this.emitChanged();
  }

  private _cursorRow = -1;
  private _cursorColumn = -1;
  private _cursorRectIndex = -1;
  private _selections: SelectionModel.Selection[] = [];
}
/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { IDisposable } from '@lumino/disposable';

import { DataGrid } from './datagrid';

import { SelectionModel } from './selectionmodel';

import { getKeyboardLayout } from '@lumino/keyboard';

import { Signal } from '@lumino/signaling';

import { Notification } from './notification';

import { CellGroup } from './cellgroup';

/**
 * A response object returned from cell input validator
 */
export interface ICellInputValidatorResponse {
  /**
   * Flag indicating cell input is valid or not
   */
  valid: boolean;
  /**
   * Validation error message. Set only when input is invalid
   */
  message?: string;
}

/**
 * An object which validates cell input values.
 */
export interface ICellInputValidator {
  /**
   * Validate cell input.
   *
   * @param cell - The object holding cell configuration data.
   *
   * @param value - The cell value input.
   *
   * @returns An object with validation result.
   */
  validate(
    cell: CellEditor.CellConfig,
    value: any
  ): ICellInputValidatorResponse;
}

/**
 * An object returned from cell editor after a successful edit.
 */
export interface ICellEditResponse {
  /**
   * An object which holds the configuration data for a cell.
   */
  cell: CellEditor.CellConfig;
  /**
   * Value input.
   */
  value: any;
  /**
   * Cursor move direction based on keys pressed to end the edit.
   */
  cursorMovement: SelectionModel.CursorMoveDirection;
}

/**
 * An object implementing cell editing.
 */
export interface ICellEditor {
  /**
   * Start editing the cell.
   *
   * @param cell - The object holding cell configuration data.
   *
   * @param options - The cell editing options.
   */
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): void;
  /**
   * Cancel editing the cell.
   */
  cancel(): void;
}

// default validation error message
const DEFAULT_INVALID_INPUT_MESSAGE = 'Invalid input!';

// A type alias for available cell data types
export type CellDataType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'string:option'
  | 'number:option'
  | 'integer:option'
  | 'date:option'
  | 'string:dynamic-option'
  | 'number:dynamic-option'
  | 'integer:dynamic-option'
  | 'date:dynamic-option';

/**
 * An object containing cell editing options.
 */
export interface ICellEditOptions {
  /**
   * Cell editor to use for editing.
   *
   * #### Notes
   * This object is only used by cell editor controller.
   * If not set, controller picks the most suitable editor
   * for the particular cell configuration.
   */
  editor?: ICellEditor;
  /**
   * Cell input validator to use for value validation.
   */
  validator?: ICellInputValidator;
  /**
   * Callback method to call on cell edit commit.
   */
  onCommit?: (response: ICellEditResponse) => void;
  /**
   * Callback method to call on cell edit cancel.
   */
  onCancel?: () => void;
}

/**
 * A cell input validator object which always returns valid.
 */
export class PassInputValidator implements ICellInputValidator {
  /**
   * Validate cell input.
   *
   * @param cell - The object holding cell configuration data.
   *
   * @param value - The cell value input.
   *
   * @returns An object with validation result.
   */
  validate(
    cell: CellEditor.CellConfig,
    value: unknown
  ): ICellInputValidatorResponse {
    return { valid: true };
  }
}

/**
 * Text cell input validator.
 */
export class TextInputValidator implements ICellInputValidator {
  /**
   * Validate cell input.
   *
   * @param cell - The object holding cell configuration data.
   *
   * @param value - The cell value input.
   *
   * @returns An object with validation result.
   */
  validate(
    cell: CellEditor.CellConfig,
    value: string
  ): ICellInputValidatorResponse {
    if (value === null) {
      return { valid: true };
    }

    if (typeof value !== 'string') {
      return {
        valid: false,
        message: 'Input must be valid text'
      };
    }

    if (!isNaN(this.minLength) && value.length < this.minLength) {
      return {
        valid: false,
        message: `Text length must be greater than ${this.minLength}`
      };
    }

    if (!isNaN(this.maxLength) && value.length > this.maxLength) {
      return {
        valid: false,
        message: `Text length must be less than ${this.maxLength}`
      };
    }

    if (this.pattern && !this.pattern.test(value)) {
      return {
        valid: false,
        message: `Text doesn't match the required pattern`
      };
    }

    return { valid: true };
  }

  /**
   * Minimum text length
   *
   * The default is Number.NaN, meaning no minimum constraint
   */
  minLength: number = Number.NaN;
  /**
   * Maximum text length
   *
   * The default is Number.NaN, meaning no maximum constraint
   */
  maxLength: number = Number.NaN;
  /**
   * Required text pattern as regular expression
   *
   * The default is null, meaning no pattern constraint
   */
  pattern: RegExp | null = null;
}

/**
 * Integer cell input validator.
 */
export class IntegerInputValidator implements ICellInputValidator {
  /**
   * Validate cell input.
   *
   * @param cell - The object holding cell configuration data.
   *
   * @param value - The cell value input.
   *
   * @returns An object with validation result.
   */
  validate(
    cell: CellEditor.CellConfig,
    value: number
  ): ICellInputValidatorResponse {
    if (value === null) {
      return { valid: true };
    }

    if (isNaN(value) || value % 1 !== 0) {
      return {
        valid: false,
        message: 'Input must be valid integer'
      };
    }

    if (!isNaN(this.min) && value < this.min) {
      return {
        valid: false,
        message: `Input must be greater than ${this.min}`
      };
    }

    if (!isNaN(this.max) && value > this.max) {
      return {
        valid: false,
        message: `Input must be less than ${this.max}`
      };
    }

    return { valid: true };
  }

  /**
   * Minimum value
   *
   * The default is Number.NaN, meaning no minimum constraint
   */
  min: number = Number.NaN;
  /**
   * Maximum value
   *
   * The default is Number.NaN, meaning no maximum constraint
   */
  max: number = Number.NaN;
}

/**
 * Real number cell input validator.
 */
export class NumberInputValidator implements ICellInputValidator {
  /**
   * Validate cell input.
   *
   * @param cell - The object holding cell configuration data.
   *
   * @param value - The cell value input.
   *
   * @returns An object with validation result.
   */
  validate(
    cell: CellEditor.CellConfig,
    value: number
  ): ICellInputValidatorResponse {
    if (value === null) {
      return { valid: true };
    }

    if (isNaN(value)) {
      return {
        valid: false,
        message: 'Input must be valid number'
      };
    }

    if (!isNaN(this.min) && value < this.min) {
      return {
        valid: false,
        message: `Input must be greater than ${this.min}`
      };
    }

    if (!isNaN(this.max) && value > this.max) {
      return {
        valid: false,
        message: `Input must be less than ${this.max}`
      };
    }

    return { valid: true };
  }

  /**
   * Minimum value
   *
   * The default is Number.NaN, meaning no minimum constraint
   */
  min: number = Number.NaN;
  /**
   * Maximum value
   *
   * The default is Number.NaN, meaning no maximum constraint
   */
  max: number = Number.NaN;
}

/**
 * An abstract base class that provides the most of the functionality
 * needed by a cell editor. All of the built-in cell editors
 * for various cell types are derived from this base class. Custom cell editors
 * can be easily implemented by extending this class.
 */
export abstract class CellEditor implements ICellEditor, IDisposable {
  /**
   * Construct a new cell editor.
   */
  constructor() {
    this.inputChanged.connect(() => {
      this.validate();
    });
  }

  /**
   * Whether the cell editor is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Dispose of the resources held by cell editor.
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    if (this._gridWheelEventHandler) {
      this.cell.grid.node.removeEventListener(
        'wheel',
        this._gridWheelEventHandler
      );
      this._gridWheelEventHandler = null;
    }

    this._closeValidityNotification();

    this._disposed = true;
    this.cell.grid.node.removeChild(this.viewportOccluder);
  }

  /**
   * Start editing the cell.
   *
   * @param cell - The object holding cell configuration data.
   *
   * @param options - The cell editing options.
   */
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): void {
    this.cell = cell;
    this.onCommit = options && options.onCommit;
    this.onCancel = options && options.onCancel;

    this.validator =
      options && options.validator
        ? options.validator
        : this.createValidatorBasedOnType();

    this._gridWheelEventHandler = () => {
      this._closeValidityNotification();
      this.updatePosition();
    };

    cell.grid.node.addEventListener('wheel', this._gridWheelEventHandler);

    this._addContainer();

    this.updatePosition();
    this.startEditing();
  }

  /**
   * Cancel editing the cell.
   */
  cancel(): void {
    if (this._disposed) {
      return;
    }

    this.dispose();
    if (this.onCancel) {
      this.onCancel();
    }
  }

  /**
   * Start editing the cell. Usually an editor widget is created and
   *  added to `editorContainer`
   */
  protected abstract startEditing(): void;
  /**
   * Return the current input entered. This method throws exceptions
   * if input is invalid. Error message in exception is shown as notification.
   */
  protected abstract getInput(): any;

  /**
   * Whether the value input is valid.
   */
  protected get validInput(): boolean {
    return this._validInput;
  }

  /**
   * Validate the cell input. Shows validation error notification when input is invalid.
   */
  protected validate(): void {
    let value;
    try {
      value = this.getInput();
    } catch (error) {
      console.log(`Input error: ${error.message}`);
      this.setValidity(false, error.message || DEFAULT_INVALID_INPUT_MESSAGE);
      return;
    }

    if (this.validator) {
      const result = this.validator.validate(this.cell, value);
      if (result.valid) {
        this.setValidity(true);
      } else {
        this.setValidity(
          false,
          result.message || DEFAULT_INVALID_INPUT_MESSAGE
        );
      }
    } else {
      this.setValidity(true);
    }
  }

  /**
   * Set validity flag.
   *
   * @param valid - Whether the input is valid.
   *
   * @param message - Notification message to show.
   *
   * If message is set to empty string (which is the default)
   * existing notification popup is removed if any.
   */
  protected setValidity(valid: boolean, message: string = ''): void {
    this._validInput = valid;

    this._closeValidityNotification();

    if (valid) {
      this.editorContainer.classList.remove('lm-mod-invalid');
    } else {
      this.editorContainer.classList.add('lm-mod-invalid');

      // show a notification popup
      if (message !== '') {
        this.validityNotification = new Notification({
          target: this.editorContainer,
          message: message,
          placement: 'bottom',
          timeout: 5000
        });
        this.validityNotification.show();
      }
    }
  }

  /**
   * Create and return a cell input validator based on configuration of the
   * cell being edited. If no suitable validator can be found, it returns undefined.
   */
  protected createValidatorBasedOnType(): ICellInputValidator | undefined {
    const cell = this.cell;
    const metadata = cell.grid.dataModel!.metadata(
      'body',
      cell.row,
      cell.column
    );

    switch (metadata && metadata.type) {
      case 'string':
        {
          const validator = new TextInputValidator();
          if (typeof metadata!.format === 'string') {
            const format = metadata!.format;
            switch (format) {
              case 'email':
                validator.pattern = new RegExp(
                  '^([a-z0-9_.-]+)@([da-z.-]+).([a-z.]{2,6})$'
                );
                break;
              case 'uuid':
                validator.pattern = new RegExp(
                  '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
                );
                break;
              case 'uri':
                // TODO
                break;
              case 'binary':
                // TODO
                break;
            }
          }

          if (metadata!.constraint) {
            if (metadata!.constraint.minLength !== undefined) {
              validator.minLength = metadata!.constraint.minLength;
            }
            if (metadata!.constraint.maxLength !== undefined) {
              validator.maxLength = metadata!.constraint.maxLength;
            }
            if (typeof metadata!.constraint.pattern === 'string') {
              validator.pattern = new RegExp(metadata!.constraint.pattern);
            }
          }
          return validator;
        }
        break;
      case 'number':
        {
          const validator = new NumberInputValidator();
          if (metadata!.constraint) {
            if (metadata!.constraint.minimum !== undefined) {
              validator.min = metadata!.constraint.minimum;
            }
            if (metadata!.constraint.maximum !== undefined) {
              validator.max = metadata!.constraint.maximum;
            }
          }
          return validator;
        }
        break;
      case 'integer':
        {
          const validator = new IntegerInputValidator();
          if (metadata!.constraint) {
            if (metadata!.constraint.minimum !== undefined) {
              validator.min = metadata!.constraint.minimum;
            }
            if (metadata!.constraint.maximum !== undefined) {
              validator.max = metadata!.constraint.maximum;
            }
          }
          return validator;
        }
        break;
    }

    return undefined;
  }

  /**
   * Compute cell rectangle and return with other cell properties.
   */
  protected getCellInfo(cell: CellEditor.CellConfig): Private.ICellInfo {
    const { grid, row, column } = cell;
    let data, columnX, rowY, width, height;
    const cellGroup = CellGroup.getGroup(grid.dataModel!, 'body', row, column);

    if (cellGroup) {
      columnX =
        grid.headerWidth -
        grid.scrollX +
        grid.columnOffset('body', cellGroup.c1);
      rowY =
        grid.headerHeight - grid.scrollY + grid.rowOffset('body', cellGroup.r1);
      width = 0;
      height = 0;

      for (let r = cellGroup.r1; r <= cellGroup.r2; r++) {
        height += grid.rowSize('body', r);
      }

      for (let c = cellGroup.c1; c <= cellGroup.c2; c++) {
        width += grid.columnSize('body', c);
      }

      data = grid.dataModel!.data('body', cellGroup.r1, cellGroup.c1);
    } else {
      columnX =
        grid.headerWidth - grid.scrollX + grid.columnOffset('body', column);
      rowY = grid.headerHeight - grid.scrollY + grid.rowOffset('body', row);
      width = grid.columnSize('body', column);
      height = grid.rowSize('body', row);
      data = grid.dataModel!.data('body', row, column);
    }

    return {
      grid: grid,
      row: row,
      column: column,
      data: data,
      x: columnX,
      y: rowY,
      width: width,
      height: height
    };
  }

  /**
   * Reposition cell editor by moving viewport occluder and cell editor container.
   */
  protected updatePosition(): void {
    const grid = this.cell.grid;
    const cellInfo = this.getCellInfo(this.cell);
    const headerHeight = grid.headerHeight;
    const headerWidth = grid.headerWidth;

    this.viewportOccluder.style.top = headerHeight + 'px';
    this.viewportOccluder.style.left = headerWidth + 'px';
    this.viewportOccluder.style.width = grid.viewportWidth - headerWidth + 'px';
    this.viewportOccluder.style.height =
      grid.viewportHeight - headerHeight + 'px';
    this.viewportOccluder.style.position = 'absolute';

    this.editorContainer.style.left = cellInfo.x - 1 - headerWidth + 'px';
    this.editorContainer.style.top = cellInfo.y - 1 - headerHeight + 'px';
    this.editorContainer.style.width = cellInfo.width + 1 + 'px';
    this.editorContainer.style.height = cellInfo.height + 1 + 'px';
    this.editorContainer.style.visibility = 'visible';
    this.editorContainer.style.position = 'absolute';
  }

  /**
   * Commit the edited value.
   *
   * @param cursorMovement - Cursor move direction based on keys pressed to end the edit.
   *
   * @returns true on valid input, false otherwise.
   */
  protected commit(
    cursorMovement: SelectionModel.CursorMoveDirection = 'none'
  ): boolean {
    this.validate();

    if (!this._validInput) {
      return false;
    }

    let value;
    try {
      value = this.getInput();
    } catch (error) {
      console.log(`Input error: ${error.message}`);
      return false;
    }

    this.dispose();

    if (this.onCommit) {
      this.onCommit({
        cell: this.cell,
        value: value,
        cursorMovement: cursorMovement
      });
    }

    return true;
  }

  /**
   * Create container elements needed to prevent editor widget overflow
   * beyond viewport and to position cell editor widget.
   */
  private _addContainer() {
    this.viewportOccluder = document.createElement('div');
    this.viewportOccluder.className = 'lm-DataGrid-cellEditorOccluder';
    this.cell.grid.node.appendChild(this.viewportOccluder);

    this.editorContainer = document.createElement('div');
    this.editorContainer.className = 'lm-DataGrid-cellEditorContainer';
    this.viewportOccluder.appendChild(this.editorContainer);

    // update mouse event pass-through state based on input validity
    this.editorContainer.addEventListener('mouseleave', (event: MouseEvent) => {
      this.viewportOccluder.style.pointerEvents = this._validInput
        ? 'none'
        : 'auto';
    });
    this.editorContainer.addEventListener('mouseenter', (event: MouseEvent) => {
      this.viewportOccluder.style.pointerEvents = 'none';
    });
  }

  /**
   * Remove validity notification popup.
   */
  private _closeValidityNotification() {
    if (this.validityNotification) {
      this.validityNotification.close();
      this.validityNotification = null;
    }
  }

  /**
   * A signal emitted when input changes.
   */
  protected inputChanged = new Signal<this, void>(this);
  /**
   * Callback method to call on cell edit commit.
   */
  protected onCommit?: (response: ICellEditResponse) => void;
  /**
   * Callback method to call on cell edit cancel.
   */
  protected onCancel?: () => void;
  /**
   * Cell configuration data for the cell being edited.
   */
  protected cell: CellEditor.CellConfig;
  /**
   * Cell input validator to use for the cell being edited.
   */
  protected validator: ICellInputValidator | undefined;
  /**
   * The div element used to prevent editor widget overflow beyond grid viewport.
   */
  protected viewportOccluder: HTMLDivElement;
  /**
   * The div element used to contain and position editor widget.
   */
  protected editorContainer: HTMLDivElement;
  /**
   * Notification popup used to show validation error messages.
   */
  protected validityNotification: Notification | null = null;
  /**
   * Whether the cell editor is disposed.
   */
  private _disposed = false;
  /**
   * Whether the value input is valid.
   */
  private _validInput: boolean = true;
  /**
   * Grid wheel event handler.
   */
  private _gridWheelEventHandler:
    | ((this: HTMLElement, ev: WheelEvent) => any)
    | null = null;
}

/**
 * Abstract base class with shared functionality
 * for cell editors which use HTML Input widget as editor.
 */
export abstract class InputCellEditor extends CellEditor {
  /**
   * Handle the DOM events for the editor.
   *
   * @param event - The DOM event sent to the editor.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._onKeyDown(event as KeyboardEvent);
        break;
      case 'blur':
        this._onBlur(event as FocusEvent);
        break;
      case 'input':
        this._onInput(event);
        break;
    }
  }

  /**
   * Dispose of the resources held by cell editor.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this._unbindEvents();

    super.dispose();
  }

  /**
   * Start editing the cell.
   */
  protected startEditing(): void {
    this.createWidget();

    const cell = this.cell;
    const cellInfo = this.getCellInfo(cell);
    this.input.value = this.deserialize(cellInfo.data);
    this.editorContainer.appendChild(this.input);
    this.input.focus();
    this.input.select();

    this.bindEvents();
  }

  protected deserialize(value: unknown): any {
    if (value === null || value === undefined) {
      return '';
    }

    return (value as any).toString();
  }

  protected createWidget(): void {
    const input = document.createElement('input');
    input.classList.add('lm-DataGrid-cellEditorWidget');
    input.classList.add('lm-DataGrid-cellEditorInput');
    input.spellcheck = false;
    input.type = this.inputType;

    this.input = input;
  }

  protected bindEvents(): void {
    this.input.addEventListener('keydown', this);
    this.input.addEventListener('blur', this);
    this.input.addEventListener('input', this);
  }

  private _unbindEvents() {
    this.input.removeEventListener('keydown', this);
    this.input.removeEventListener('blur', this);
    this.input.removeEventListener('input', this);
  }

  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this.input.focus();
    }
  }

  private _onInput(event: Event) {
    this.inputChanged.emit(void 0);
  }

  protected input: HTMLInputElement;
  protected abstract inputType: string;
}

/**
 * Cell editor for text cells.
 */
export class TextCellEditor extends InputCellEditor {
  /**
   * Return the current text input entered.
   */
  protected getInput(): string | null {
    return this.input.value;
  }

  protected inputType: string = 'text';
}

/**
 * Cell editor for real number cells.
 */
export class NumberCellEditor extends InputCellEditor {
  /**
   * Start editing the cell.
   */
  protected startEditing(): void {
    super.startEditing();

    this.input.step = 'any';

    const cell = this.cell;

    const metadata = cell.grid.dataModel!.metadata(
      'body',
      cell.row,
      cell.column
    );
    const constraint = metadata.constraint;
    if (constraint) {
      if (constraint.minimum) {
        this.input.min = constraint.minimum;
      }
      if (constraint.maximum) {
        this.input.max = constraint.maximum;
      }
    }
  }

  /**
   * Return the current number input entered. This method throws exception
   * if input is invalid.
   */
  protected getInput(): number | null {
    let value = this.input.value;
    if (value.trim() === '') {
      return null;
    }

    const floatValue = parseFloat(value);
    if (isNaN(floatValue)) {
      throw new Error('Invalid input');
    }

    return floatValue;
  }

  protected inputType: string = 'number';
}

/**
 * Cell editor for integer cells.
 */
export class IntegerCellEditor extends InputCellEditor {
  /**
   * Start editing the cell.
   */
  protected startEditing(): void {
    super.startEditing();

    this.input.step = '1';

    const cell = this.cell;

    const metadata = cell.grid.dataModel!.metadata(
      'body',
      cell.row,
      cell.column
    );
    const constraint = metadata.constraint;
    if (constraint) {
      if (constraint.minimum) {
        this.input.min = constraint.minimum;
      }
      if (constraint.maximum) {
        this.input.max = constraint.maximum;
      }
    }
  }

  /**
   * Return the current integer input entered. This method throws exception
   * if input is invalid.
   */
  protected getInput(): number | null {
    let value = this.input.value;
    if (value.trim() === '') {
      return null;
    }

    let intValue = parseInt(value);
    if (isNaN(intValue)) {
      throw new Error('Invalid input');
    }

    return intValue;
  }

  protected inputType: string = 'number';
}

/**
 * Cell editor for date cells.
 */
export class DateCellEditor extends CellEditor {
  /**
   * Handle the DOM events for the editor.
   *
   * @param event - The DOM event sent to the editor.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._onKeyDown(event as KeyboardEvent);
        break;
      case 'blur':
        this._onBlur(event as FocusEvent);
        break;
    }
  }

  /**
   * Dispose of the resources held by cell editor.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this._unbindEvents();

    super.dispose();
  }

  /**
   * Start editing the cell.
   */
  protected startEditing(): void {
    this._createWidget();

    const cell = this.cell;
    const cellInfo = this.getCellInfo(cell);
    this._input.value = this._deserialize(cellInfo.data);
    this.editorContainer.appendChild(this._input);
    this._input.focus();

    this._bindEvents();
  }

  /**
   * Return the current date input entered.
   */
  protected getInput(): string | null {
    return this._input.value;
  }

  private _deserialize(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    return value.toString();
  }

  private _createWidget() {
    const input = document.createElement('input');
    input.type = 'date';
    input.pattern = 'd{4}-d{2}-d{2}';
    input.classList.add('lm-DataGrid-cellEditorWidget');
    input.classList.add('lm-DataGrid-cellEditorInput');

    this._input = input;
  }

  private _bindEvents() {
    this._input.addEventListener('keydown', this);
    this._input.addEventListener('blur', this);
  }

  private _unbindEvents() {
    this._input.removeEventListener('keydown', this);
    this._input.removeEventListener('blur', this);
  }

  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this._input.focus();
    }
  }

  private _input: HTMLInputElement;
}

/**
 * Cell editor for boolean cells.
 */
export class BooleanCellEditor extends CellEditor {
  /**
   * Handle the DOM events for the editor.
   *
   * @param event - The DOM event sent to the editor.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._onKeyDown(event as KeyboardEvent);
        break;
      case 'mousedown':
        // fix focus loss problem in Safari and Firefox
        this._input.focus();
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'blur':
        this._onBlur(event as FocusEvent);
        break;
    }
  }

  /**
   * Dispose of the resources held by cell editor.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this._unbindEvents();

    super.dispose();
  }

  /**
   * Start editing the cell.
   */
  protected startEditing(): void {
    this._createWidget();

    const cell = this.cell;
    const cellInfo = this.getCellInfo(cell);
    this._input.checked = this._deserialize(cellInfo.data);
    this.editorContainer.appendChild(this._input);
    this._input.focus();

    this._bindEvents();
  }

  /**
   * Return the current boolean input entered.
   */
  protected getInput(): boolean | null {
    return this._input.checked;
  }

  private _deserialize(value: any): any {
    if (value === null || value === undefined) {
      return false;
    }

    return value == true;
  }

  private _createWidget() {
    const input = document.createElement('input');
    input.classList.add('lm-DataGrid-cellEditorWidget');
    input.classList.add('lm-DataGrid-cellEditorCheckbox');
    input.type = 'checkbox';
    input.spellcheck = false;

    this._input = input;
  }

  private _bindEvents() {
    this._input.addEventListener('keydown', this);
    this._input.addEventListener('mousedown', this);
    this._input.addEventListener('blur', this);
  }

  private _unbindEvents() {
    this._input.removeEventListener('keydown', this);
    this._input.removeEventListener('mousedown', this);
    this._input.removeEventListener('blur', this);
  }

  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this._input.focus();
    }
  }

  private _input: HTMLInputElement;
}

/**
 * Cell editor for option cells.
 *
 * It supports multiple option selection. If cell metadata contains
 * type attribute 'array', then it behaves as a multi select.
 * In that case cell data is expected to be list of string values.
 */
export class OptionCellEditor extends CellEditor {
  /**
   * Dispose of the resources held by cell editor.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    super.dispose();

    if (this._isMultiSelect) {
      document.body.removeChild(this._select);
    }
  }

  /**
   * Start editing the cell.
   */
  protected startEditing(): void {
    const cell = this.cell;
    const cellInfo = this.getCellInfo(cell);
    const metadata = cell.grid.dataModel!.metadata(
      'body',
      cell.row,
      cell.column
    );
    this._isMultiSelect = metadata.type === 'array';
    this._createWidget();

    if (this._isMultiSelect) {
      this._select.multiple = true;
      const values = this._deserialize(cellInfo.data) as string[];
      for (let i = 0; i < this._select.options.length; ++i) {
        const option = this._select.options.item(i);
        option!.selected = values.indexOf(option!.value) !== -1;
      }
      document.body.appendChild(this._select);
    } else {
      this._select.value = this._deserialize(cellInfo.data) as string;
      this.editorContainer.appendChild(this._select);
    }

    this._select.focus();

    this._bindEvents();

    this.updatePosition();
  }

  /**
   * Return the current option input.
   */
  protected getInput(): string | string[] | null {
    if (this._isMultiSelect) {
      const input: string[] = [];
      for (let i = 0; i < this._select.selectedOptions.length; ++i) {
        input.push(this._select.selectedOptions.item(i)!.value);
      }
      return input;
    } else {
      return this._select.value;
    }
  }

  /**
   * Reposition cell editor.
   */
  protected updatePosition(): void {
    super.updatePosition();

    if (!this._isMultiSelect) {
      return;
    }

    const cellInfo = this.getCellInfo(this.cell);

    this._select.style.position = 'absolute';
    const editorContainerRect = this.editorContainer.getBoundingClientRect();

    this._select.style.left = editorContainerRect.left + 'px';
    this._select.style.top = editorContainerRect.top + cellInfo.height + 'px';
    this._select.style.width = editorContainerRect.width + 'px';
    this._select.style.maxHeight = '60px';

    this.editorContainer.style.visibility = 'hidden';
  }

  private _deserialize(value: any): string | string[] {
    if (value === null || value === undefined) {
      return '';
    }

    if (this._isMultiSelect) {
      const values: string[] = [];
      if (Array.isArray(value)) {
        for (let item of value) {
          values.push(item.toString());
        }
      }
      return values;
    } else {
      return value.toString();
    }
  }

  private _createWidget() {
    const cell = this.cell;
    const metadata = cell.grid.dataModel!.metadata(
      'body',
      cell.row,
      cell.column
    );
    const items = metadata.constraint.enum;

    const select = document.createElement('select');
    select.classList.add('lm-DataGrid-cellEditorWidget');
    for (let item of items) {
      const option = document.createElement('option');
      option.value = item;
      option.text = item;
      select.appendChild(option);
    }

    this._select = select;
  }

  private _bindEvents() {
    this._select.addEventListener('keydown', this._onKeyDown.bind(this));
    this._select.addEventListener('blur', this._onBlur.bind(this));
  }

  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this._select.focus();
    }
  }

  private _select: HTMLSelectElement;
  private _isMultiSelect: boolean = false;
}

/**
 * Cell editor for option cells whose value can be any value
 * from set of pre-defined options or values that can be input by user.
 */
export class DynamicOptionCellEditor extends CellEditor {
  /**
   * Handle the DOM events for the editor.
   *
   * @param event - The DOM event sent to the editor.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._onKeyDown(event as KeyboardEvent);
        break;
      case 'blur':
        this._onBlur(event as FocusEvent);
        break;
    }
  }

  /**
   * Dispose of the resources held by cell editor.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this._unbindEvents();

    super.dispose();
  }

  /**
   * Start editing the cell.
   */
  protected startEditing(): void {
    this._createWidget();

    const cell = this.cell;
    const cellInfo = this.getCellInfo(cell);
    this._input.value = this._deserialize(cellInfo.data);
    this.editorContainer.appendChild(this._input);
    this._input.focus();
    this._input.select();

    this._bindEvents();
  }

  /**
   * Return the current option input.
   */
  protected getInput(): string | null {
    return this._input.value;
  }

  private _deserialize(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    return value.toString();
  }

  private _createWidget() {
    const cell = this.cell;
    const grid = cell.grid;
    const dataModel = grid.dataModel!;
    const rowCount = dataModel.rowCount('body');

    const listId = 'cell-editor-list';
    const list = document.createElement('datalist');
    list.id = listId;
    const input = document.createElement('input');
    input.classList.add('lm-DataGrid-cellEditorWidget');
    input.classList.add('lm-DataGrid-cellEditorInput');
    const valueSet = new Set<string>();
    for (let r = 0; r < rowCount; ++r) {
      const data = dataModel.data('body', r, cell.column);
      if (data) {
        valueSet.add(data);
      }
    }
    valueSet.forEach((value: string) => {
      const option = document.createElement('option');
      option.value = value;
      option.text = value;
      list.appendChild(option);
    });
    this.editorContainer.appendChild(list);
    input.setAttribute('list', listId);

    this._input = input;
  }

  private _bindEvents() {
    this._input.addEventListener('keydown', this);
    this._input.addEventListener('blur', this);
  }

  private _unbindEvents() {
    this._input.removeEventListener('keydown', this);
    this._input.removeEventListener('blur', this);
  }

  private _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  private _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this._input.focus();
    }
  }

  private _input: HTMLInputElement;
}

/**
 * The namespace for the `CellEditor` class statics.
 */
export namespace CellEditor {
  /**
   * An object which holds the configuration data for a cell.
   */
  export type CellConfig = {
    /**
     * The grid containing the cell.
     */
    readonly grid: DataGrid;
    /**
     * The row index of the cell.
     */
    readonly row: number;

    /**
     * The column index of the cell.
     */
    readonly column: number;
  };
}

/**
 * A namespace for module-private functionality.
 */
namespace Private {
  /**
   * A type alias for cell properties.
   */
  export type ICellInfo = {
    grid: DataGrid;
    row: number;
    column: number;
    data: any;
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  BooleanCellEditor,
  CellDataType,
  CellEditor,
  DateCellEditor,
  DynamicOptionCellEditor,
  ICellEditOptions,
  ICellEditor,
  ICellEditResponse,
  IntegerCellEditor,
  NumberCellEditor,
  OptionCellEditor,
  TextCellEditor
} from './celleditor';

import { CellGroup } from './cellgroup';

import { DataModel, MutableDataModel } from './datamodel';

/**
 * A type alias for cell editor override identifier.
 */
export type EditorOverrideIdentifier =
  | CellDataType
  | DataModel.Metadata
  | 'default';

/**
 * An object which manages cell editing.
 */
export interface ICellEditorController {
  /**
   * Override cell editor for the cells matching the identifier.
   *
   * @param identifier - Cell identifier to use when matching cells.
   * if identifier is a CellDataType, then cell matching is done using data type of the cell,
   * if identifier is a Metadata, then partial match of the cell metadata with identifier is used for match,
   * if identifier is 'default' then override is used as default editor when no other editor is found suitable
   *
   * @param editor - The cell editor to use or resolver to use to get an editor for matching cells.
   */
  setEditor(
    identifier: EditorOverrideIdentifier,
    editor: ICellEditor | Resolver
  ): void;
  /**
   * Start editing a cell.
   *
   * @param cell - The object holding cell configuration data.
   *
   * @param options - The cell editing options.
   */
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): boolean;
  /**
   * Cancel editing.
   */
  cancel(): void;
}

/**
 * A type alias for a cell editor config function.
 *
 * This type is used to compute a value from a cell config object.
 */
export type ConfigFunc<T> = (config: CellEditor.CellConfig) => T;

/**
 * A type alias for a cell editor config option.
 *
 * A config option can be a static value or a config function.
 */
export type ConfigOption<T> = T | ConfigFunc<T>;

/**
 * A type alias for a cell editor resolver function.
 */
export type Resolver = ConfigFunc<ICellEditor | undefined>;

/**
 * Resolve a config option for a cell editor.
 *
 * @param option - The config option to resolve.
 *
 * @param config - The cell config object.
 *
 * @returns The resolved value for the option.
 */
export function resolveOption<T>(
  option: ConfigOption<T>,
  config: CellEditor.CellConfig
): T {
  return typeof option === 'function'
    ? (option as ConfigFunc<T>)(config)
    : option;
}

/**
 * An object which manages cell editing. It stores editor overrides,
 * decides which editor to use for a cell, makes sure there is only one editor active.
 */
export class CellEditorController implements ICellEditorController {
  /**
   * Override cell editor for the cells matching the identifier.
   *
   * @param identifier - Cell identifier to use when matching cells.
   * if identifier is a CellDataType, then cell matching is done using data type of the cell,
   * if identifier is a Metadata, then partial match of the cell metadata with identifier is used for match,
   * if identifier is 'default' then override is used as default editor when no other editor is found suitable
   *
   * @param editor - The cell editor to use or resolver to use to get an editor for matching cells.
   */
  setEditor(
    identifier: EditorOverrideIdentifier,
    editor: ICellEditor | Resolver
  ): void {
    if (typeof identifier === 'string') {
      this._typeBasedOverrides.set(identifier, editor);
    } else {
      const key = this._metadataIdentifierToKey(identifier);
      this._metadataBasedOverrides.set(key, [identifier, editor]);
    }
  }

  /**
   * Start editing a cell.
   *
   * @param cell - The object holding cell configuration data.
   *
   * @param options - The cell editing options.
   */
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): boolean {
    const grid = cell.grid;

    if (!grid.editable) {
      console.error('Grid cannot be edited!');
      return false;
    }

    this.cancel();

    this._cell = cell;

    options = options || {};
    options.onCommit = options.onCommit || this._onCommit.bind(this);
    options.onCancel = options.onCancel || this._onCancel.bind(this);

    // if an editor is passed in with options, then use it for editing
    if (options.editor) {
      this._editor = options.editor;
      options.editor.edit(cell, options);
      return true;
    }

    // choose an editor based on overrides / cell data type
    const editor = this._getEditor(cell);
    if (editor) {
      this._editor = editor;
      editor.edit(cell, options);
      return true;
    }

    return false;
  }

  /**
   * Cancel editing.
   */
  cancel(): void {
    if (this._editor) {
      this._editor.cancel();
      this._editor = null;
    }

    this._cell = null;
  }

  private _onCommit(response: ICellEditResponse): void {
    const cell = this._cell;

    if (!cell) {
      return;
    }

    const grid = cell.grid;
    const dataModel = grid.dataModel as MutableDataModel;
    let row = cell.row;
    let column = cell.column;

    const cellGroup = CellGroup.getGroup(grid.dataModel!, 'body', row, column);
    if (cellGroup) {
      row = cellGroup.r1;
      column = cellGroup.c1;
    }

    dataModel.setData('body', row, column, response.value);
    grid.viewport.node.focus();
    if (response.cursorMovement !== 'none') {
      grid.moveCursor(response.cursorMovement);
      grid.scrollToCursor();
    }
  }

  private _onCancel(): void {
    if (!this._cell) {
      return;
    }

    this._cell.grid.viewport.node.focus();
  }

  private _getDataTypeKey(cell: CellEditor.CellConfig): string {
    const metadata = cell.grid.dataModel
      ? cell.grid.dataModel.metadata('body', cell.row, cell.column)
      : null;

    if (!metadata) {
      return 'default';
    }

    let key = '';

    if (metadata) {
      key = metadata.type;
    }

    if (metadata.constraint && metadata.constraint.enum) {
      if (metadata.constraint.enum === 'dynamic') {
        key += ':dynamic-option';
      } else {
        key += ':option';
      }
    }

    return key;
  }

  private _objectToKey(object: any): string {
    let str = '';
    for (let key in object) {
      const value = object[key];
      if (typeof value === 'object') {
        str += `${key}:${this._objectToKey(value)}`;
      } else {
        str += `[${key}:${value}]`;
      }
    }

    return str;
  }

  private _metadataIdentifierToKey(metadata: DataModel.Metadata): string {
    return this._objectToKey(metadata);
  }

  private _metadataMatchesIdentifier(
    metadata: DataModel.Metadata,
    identifier: DataModel.Metadata
  ): boolean {
    for (let key in identifier) {
      if (!metadata.hasOwnProperty(key)) {
        return false;
      }

      const identifierValue = identifier[key];
      const metadataValue = metadata[key];
      if (typeof identifierValue === 'object') {
        if (!this._metadataMatchesIdentifier(metadataValue, identifierValue)) {
          return false;
        }
      } else if (metadataValue !== identifierValue) {
        return false;
      }
    }

    return true;
  }

  private _getMetadataBasedEditor(
    cell: CellEditor.CellConfig
  ): ICellEditor | undefined {
    let editorMatched: ICellEditor | undefined;
    const metadata = cell.grid.dataModel!.metadata(
      'body',
      cell.row,
      cell.column
    );
    if (metadata) {
      this._metadataBasedOverrides.forEach(value => {
        if (!editorMatched) {
          let [identifier, editor] = value;
          if (this._metadataMatchesIdentifier(metadata, identifier)) {
            editorMatched = resolveOption(editor, cell);
          }
        }
      });
    }

    return editorMatched;
  }

  /**
   * Choose the most appropriate cell editor to use based on overrides / cell data type.
   *
   * If no match is found in overrides or based on cell data type, and if cell has a primitive
   * data type then TextCellEditor is used as default cell editor. If 'default' cell editor
   * is overridden, then it is used instead of TextCellEditor for default.
   */
  private _getEditor(cell: CellEditor.CellConfig): ICellEditor | undefined {
    const dtKey = this._getDataTypeKey(cell);

    // find an editor based on data type based override
    if (this._typeBasedOverrides.has(dtKey)) {
      const editor = this._typeBasedOverrides.get(dtKey);
      return resolveOption(editor!, cell);
    } // find an editor based on metadata match based override
    else if (this._metadataBasedOverrides.size > 0) {
      const editor = this._getMetadataBasedEditor(cell);
      if (editor) {
        return editor;
      }
    }

    // choose an editor based on data type
    switch (dtKey) {
      case 'string':
        return new TextCellEditor();
      case 'number':
        return new NumberCellEditor();
      case 'integer':
        return new IntegerCellEditor();
      case 'boolean':
        return new BooleanCellEditor();
      case 'date':
        return new DateCellEditor();
      case 'string:option':
      case 'number:option':
      case 'integer:option':
      case 'date:option':
      case 'array:option':
        return new OptionCellEditor();
      case 'string:dynamic-option':
      case 'number:dynamic-option':
      case 'integer:dynamic-option':
      case 'date:dynamic-option':
        return new DynamicOptionCellEditor();
    }

    // if an override exists for 'default', then use it
    if (this._typeBasedOverrides.has('default')) {
      const editor = this._typeBasedOverrides.get('default');
      return resolveOption(editor!, cell);
    }

    // if cell has a primitive data type then use TextCellEditor
    const data = cell.grid.dataModel!.data('body', cell.row, cell.column);
    if (!data || typeof data !== 'object') {
      return new TextCellEditor();
    }

    // no suitable editor found for the cell
    return undefined;
  }

  // active cell editor
  private _editor: ICellEditor | null = null;
  // active cell being edited
  private _cell: CellEditor.CellConfig | null = null;
  // cell editor overrides based on cell data type identifier
  private _typeBasedOverrides: Map<string, ICellEditor | Resolver> = new Map();
  // cell editor overrides based on partial metadata match
  private _metadataBasedOverrides: Map<
    string,
    [DataModel.Metadata, ICellEditor | Resolver]
  > = new Map();
}
/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import { DataModel } from './datamodel';
import { SectionList } from './sectionlist';

/**
 * An interface describing a merged cell group.
 * r1: start row
 * r2: end row
 * c1: start column
 * c2: end column
 */
export interface CellGroup {
  r1: number;
  r2: number;
  c1: number;
  c2: number;
}

/**
 * A collection of helper functions relating to merged cell groups
 */
export namespace CellGroup {
  export function areCellsMerged(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    cell1: number[],
    cell2: number[]
  ): boolean {
    const numGroups = dataModel.groupCount(rgn);
    const [row1, column1] = cell1;
    const [row2, column2] = cell2;

    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!;
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
        return true;
      }
    }
    return false;
  }

  /**
   * Calculates the cell boundary offsets needed for
   * a row or column at the given index by taking
   * into account merged cell groups in the region.
   * @param dataModel
   * @param regions
   * @param axis
   * @param sectionList
   * @param index
   */
  export function calculateMergeOffsets(
    dataModel: DataModel,
    regions: DataModel.CellRegion[],
    axis: 'row' | 'column',
    sectionList: SectionList,
    index: number
  ): [number, number, CellGroup] {
    let mergeStartOffset = 0;
    let mergeEndOffset = 0;
    let mergedCellGroups: CellGroup[] = [];

    for (const region of regions) {
      mergedCellGroups = mergedCellGroups.concat(
        getCellGroupsAtRegion(dataModel, region)
      );
    }

    let groupsAtAxis: CellGroup[] = [];

    if (axis === 'row') {
      for (const region of regions) {
        groupsAtAxis = groupsAtAxis.concat(
          getCellGroupsAtRow(dataModel, region, index)
        );
      }
    } else {
      for (const region of regions) {
        groupsAtAxis = groupsAtAxis.concat(
          getCellGroupsAtColumn(dataModel, region, index)
        );
      }
    }

    if (groupsAtAxis.length === 0) {
      return [0, 0, { r1: -1, r2: -1, c1: -1, c2: -1 }];
    }

    let joinedGroup = groupsAtAxis[0];

    for (let g = 0; g < mergedCellGroups.length; g++) {
      const group = mergedCellGroups[g];
      if (areCellGroupsIntersectingAtAxis(joinedGroup, group, axis)) {
        joinedGroup = joinCellGroups([group, joinedGroup]);
        mergedCellGroups.splice(g, 1);
        g = 0;
      }
    }

    let minRow = joinedGroup.r1;
    let maxRow = joinedGroup.r2;

    for (let r = index - 1; r >= minRow; r--) {
      mergeStartOffset += sectionList.sizeOf(r);
    }

    for (let r = index + 1; r <= maxRow; r++) {
      mergeEndOffset += sectionList.sizeOf(r);
    }

    return [mergeStartOffset, mergeEndOffset, joinedGroup];
  }

  /**
   * Checks if two cell-groups are intersecting
   * in the given axis.
   * @param group1
   * @param group2
   * @param axis
   */
  export function areCellGroupsIntersectingAtAxis(
    group1: CellGroup,
    group2: CellGroup,
    axis: 'row' | 'column'
  ): boolean {
    if (axis === 'row') {
      return (
        (group1.r1 >= group2.r1 && group1.r1 <= group2.r2) ||
        (group1.r2 >= group2.r1 && group1.r2 <= group2.r2) ||
        (group2.r1 >= group1.r1 && group2.r1 <= group1.r2) ||
        (group2.r2 >= group1.r1 && group2.r2 <= group1.r2)
      );
    }
    return (
      (group1.c1 >= group2.c1 && group1.c1 <= group2.c2) ||
      (group1.c2 >= group2.c1 && group1.c2 <= group2.c2) ||
      (group2.c1 >= group1.c1 && group2.c1 <= group1.c2) ||
      (group2.c2 >= group1.c1 && group2.c2 <= group1.c2)
    );
  }

  /**
   * Checks if cell-groups are intersecting.
   * @param group1
   * @param group2
   */
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
    );
  }

  /**
   * Retrieves the index of the cell-group to which
   * the cell at the given row, column belongs.
   * @param dataModel
   * @param rgn
   * @param row
   * @param column
   */
  export function getGroupIndex(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    row: number,
    column: number
  ): number {
    const numGroups = dataModel.groupCount(rgn);
    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!;
      if (
        row >= group.r1 &&
        row <= group.r2 &&
        column >= group.c1 &&
        column <= group.c2
      ) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Returns a cell-group for the given row/index coordinates.
   * @param dataModel
   * @param rgn
   * @param row
   * @param column
   */
  export function getGroup(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    row: number,
    column: number
  ): CellGroup | null {
    const groupIndex = getGroupIndex(dataModel, rgn, row, column);
    if (groupIndex === -1) {
      return null;
    }

    return dataModel.group(rgn, groupIndex);
  }

  /**
   * Returns all cell groups which belong to
   * a given cell cell region.
   * @param dataModel
   * @param rgn
   */
  export function getCellGroupsAtRegion(
    dataModel: DataModel,
    rgn: DataModel.CellRegion
  ): CellGroup[] {
    let groupsAtRegion: CellGroup[] = [];
    const numGroups = dataModel.groupCount(rgn);

    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!;
      groupsAtRegion.push(group);
    }
    return groupsAtRegion;
  }

  /**
   * Calculates and returns a merged cell-group from
   * two cell-group objects.
   * @param groups
   */
  export function joinCellGroups(groups: CellGroup[]): CellGroup {
    let startRow = Number.MAX_VALUE;
    let endRow = Number.MIN_VALUE;
    let startColumn = Number.MAX_VALUE;
    let endColumn = Number.MIN_VALUE;

    for (const group of groups) {
      startRow = Math.min(startRow, group.r1);
      endRow = Math.max(endRow, group.r2);
      startColumn = Math.min(startColumn, group.c1);
      endColumn = Math.max(endColumn, group.c2);
    }

    return { r1: startRow, r2: endRow, c1: startColumn, c2: endColumn };
  }

  /**
   * Merges a cell group with other cells groups in the
   * same region if they intersect.
   * @param dataModel the data model of the grid.
   * @param group the target cell group.
   * @param region the region of the cell group.
   * @returns a new cell group after merging has happened.
   */
  export function joinCellGroupWithMergedCellGroups(
    dataModel: DataModel,
    group: CellGroup,
    region: DataModel.CellRegion
  ): CellGroup {
    let joinedGroup: CellGroup = { ...group };

    const mergedCellGroups: CellGroup[] = getCellGroupsAtRegion(
      dataModel,
      region
    );

    for (let g = 0; g < mergedCellGroups.length; g++) {
      const mergedGroup = mergedCellGroups[g];
      if (areCellGroupsIntersecting(joinedGroup, mergedGroup)) {
        joinedGroup = joinCellGroups([joinedGroup, mergedGroup]);
      }
    }

    return joinedGroup;
  }

  /**
   * Retrieves a list of cell groups intersecting at
   * a given row.
   * @param dataModel data model of the grid.
   * @param rgn the cell region.
   * @param row the target row to look for intersections at.
   * @returns all cell groups intersecting with the row.
   */
  export function getCellGroupsAtRow(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    row: number
  ): CellGroup[] {
    let groupsAtRow = [];
    const numGroups = dataModel.groupCount(rgn);

    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!;
      if (row >= group.r1 && row <= group.r2) {
        groupsAtRow.push(group);
      }
    }
    return groupsAtRow;
  }

  /**
   * Retrieves a list of cell groups intersecting at
   * a given column.
   * @param dataModel data model of the grid.
   * @param rgn the cell region.
   * @param column the target column to look for intersections at.
   * @returns all cell groups intersecting with the column.
   */
  export function getCellGroupsAtColumn(
    dataModel: DataModel,
    rgn: DataModel.CellRegion,
    column: number
  ): CellGroup[] {
    let groupsAtColumn = [];
    const numGroups = dataModel.groupCount(rgn);

    for (let i = 0; i < numGroups; i++) {
      const group = dataModel.group(rgn, i)!;
      if (column >= group.c1 && column <= group.c2) {
        groupsAtColumn.push(group);
      }
    }
    return groupsAtColumn;
  }

  /**
   * Checks if cell group 1 is above cell group 2.
   * @param group1 cell group 1.
   * @param group2 cell group 2.
   * @returns boolean.
   */
  export function isCellGroupAbove(
    group1: CellGroup,
    group2: CellGroup
  ): boolean {
    return group2.r2 >= group1.r1;
  }

  /**
   * Checks if cell group 1 is below cell group 2.
   */
  export function isCellGroupBelow(
    group1: CellGroup,
    group2: CellGroup
  ): boolean {
    return group2.r1 <= group1.r2;
  }

  /**
   * Merges a target cell group with any cell groups
   * it intersects with at a given row or column.
   * @param dataModel data model of the grid.
   * @param regions list of cell regions.
   * @param axis row or column.
   * @param group the target cell group.
   * @returns a new merged cell group.
   */
  export function joinCellGroupsIntersectingAtAxis(
    dataModel: DataModel,
    regions: DataModel.CellRegion[],
    axis: 'row' | 'column',
    group: CellGroup
  ): CellGroup {
    let groupsAtAxis: CellGroup[] = [];
    if (axis === 'row') {
      for (const region of regions) {
        for (let r = group.r1; r <= group.r2; r++) {
          groupsAtAxis = groupsAtAxis.concat(
            CellGroup.getCellGroupsAtRow(dataModel, region, r)
          );
        }
      }
    } else {
      for (const region of regions) {
        for (let c = group.c1; c <= group.c2; c++) {
          groupsAtAxis = groupsAtAxis.concat(
            CellGroup.getCellGroupsAtColumn(dataModel, region, c)
          );
        }
      }
    }

    let mergedGroupAtAxis: CellGroup = CellGroup.joinCellGroups(groupsAtAxis);

    if (groupsAtAxis.length > 0) {
      let mergedCellGroups: CellGroup[] = [];
      for (const region of regions) {
        mergedCellGroups = mergedCellGroups.concat(
          CellGroup.getCellGroupsAtRegion(dataModel, region)
        );
      }

      for (let g = 0; g < mergedCellGroups.length; g++) {
        const group = mergedCellGroups[g];
        if (
          CellGroup.areCellGroupsIntersectingAtAxis(
            mergedGroupAtAxis,
            group,
            axis
          )
        ) {
          mergedGroupAtAxis = CellGroup.joinCellGroups([
            group,
            mergedGroupAtAxis
          ]);
          mergedCellGroups.splice(g, 1);
          g = 0;
        }
      }
    }
    return mergedGroupAtAxis;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { DataModel } from './datamodel';

import { GraphicsContext } from './graphicscontext';

/**
 * An object which renders the cells of a data grid.
 *
 * #### Notes
 * If the predefined cell renderers are insufficient for a particular
 * use case, a custom cell renderer can be defined which derives from
 * this class.
 *
 * The data grid renders cells in column-major order, by region. The
 * region order is: body, row header, column header, corner header.
 */
export abstract class CellRenderer {
  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * #### Notes
   * The grid will save/restore the `gc` state before/after invoking
   * the renderer.
   *
   * For performance, the cell content is efficiently clipped to the
   * width of the column, but *the height is not clipped*. If height
   * clipping is needed, the renderer must set up its own clip rect.
   *
   * The renderer **must not** draw outside the cell bounding height.
   */
  abstract paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void;
}

/**
 * The namespace for the `CellRenderer` class statics.
 */
export namespace CellRenderer {
  /**
   * An object which holds the configuration data for a cell.
   */
  export type CellConfig = {
    /**
     * The X position of the cell rectangle, in viewport coordinates.
     */
    readonly x: number;

    /**
     * The Y position of the cell rectangle, in viewport coordinates.
     */
    readonly y: number;

    /**
     * The height of the cell rectangle, in viewport pixels.
     */
    readonly height: number;

    /**
     * The width of the cell rectangle, in viewport pixels.
     */
    readonly width: number;

    /**
     * The region for the cell.
     */
    readonly region: DataModel.CellRegion;

    /**
     * The row index of the cell.
     */
    readonly row: number;

    /**
     * The column index of the cell.
     */
    readonly column: number;

    /**
     * The value for the cell.
     */
    readonly value: any;

    /**
     * The metadata for the cell.
     */
    readonly metadata: DataModel.Metadata;
  };

  /**
   * A type alias for a cell renderer config function.
   *
   * This type is used to compute a value from a cell config object.
   */
  export type ConfigFunc<T> = (config: CellConfig) => T;

  /**
   * A type alias for a cell renderer config option.
   *
   * A config option can be a static value or a config function.
   */
  export type ConfigOption<T> = T | ConfigFunc<T>;

  /**
   * Resolve a config option for a cell renderer.
   *
   * @param option - The config option to resolve.
   *
   * @param config - The cell config object.
   *
   * @returns The resolved value for the option.
   */
  export function resolveOption<T>(
    option: ConfigOption<T>,
    config: CellConfig
  ): T {
    return typeof option === 'function'
      ? (option as ConfigFunc<T>)(config)
      : option;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { IDisposable } from '@lumino/disposable';

import { ClipboardExt, ElementExt, Platform } from '@lumino/domutils';

import {
  ConflatableMessage,
  IMessageHandler,
  Message,
  MessageLoop
} from '@lumino/messaging';

import { GridLayout, ScrollBar, Widget } from '@lumino/widgets';

import { CellRenderer } from './cellrenderer';

import { DataModel, MutableDataModel } from './datamodel';

import { CellGroup } from './cellgroup';

import { GraphicsContext } from './graphicscontext';

import { RendererMap } from './renderermap';

import { SectionList } from './sectionlist';

import { SelectionModel } from './selectionmodel';

import {
  CellEditorController,
  ICellEditorController
} from './celleditorcontroller';

import { JSONExt } from '@lumino/coreutils';

import { TextRenderer } from './textrenderer';

/**
 * A widget which implements a high-performance tabular data grid.
 *
 * #### Notes
 * A data grid is implemented as a composition of child widgets. These
 * child widgets are considered an implementation detail. Manipulating
 * the child widgets of a data grid directly is undefined behavior.
 *
 * This class is not designed to be subclassed.
 */
export class DataGrid extends Widget {
  /**
   * Construct a new data grid.
   *
   * @param options - The options for initializing the data grid.
   */
  constructor(options: DataGrid.IOptions = {}) {
    super();
    this.addClass('lm-DataGrid');

    // Parse the simple options.
    this._style = options.style || DataGrid.defaultStyle;
    this._stretchLastRow = options.stretchLastRow || false;
    this._stretchLastColumn = options.stretchLastColumn || false;
    this._headerVisibility = options.headerVisibility || 'all';
    this._cellRenderers = options.cellRenderers || new RendererMap();
    this._copyConfig = options.copyConfig || DataGrid.defaultCopyConfig;

    // Connect to the renderer map changed signal.
    this._cellRenderers.changed.connect(this._onRenderersChanged, this);

    // Parse the default sizes.
    let defaultSizes = options.defaultSizes || DataGrid.defaultSizes;
    let minimumSizes = options.minimumSizes || DataGrid.minimumSizes;

    // Set up the sections lists.
    this._rowSections = new SectionList({
      defaultSize: defaultSizes.rowHeight,
      minimumSize: minimumSizes.rowHeight
    });
    this._columnSections = new SectionList({
      defaultSize: defaultSizes.columnWidth,
      minimumSize: minimumSizes.columnWidth
    });
    this._rowHeaderSections = new SectionList({
      defaultSize: defaultSizes.rowHeaderWidth,
      minimumSize: minimumSizes.rowHeaderWidth
    });
    this._columnHeaderSections = new SectionList({
      defaultSize: defaultSizes.columnHeaderHeight,
      minimumSize: minimumSizes.columnHeaderHeight
    });

    // Create the canvas, buffer, and overlay objects.
    this._canvas = Private.createCanvas();
    this._buffer = Private.createCanvas();
    this._overlay = Private.createCanvas();

    // Get the graphics contexts for the canvases.
    this._canvasGC = this._canvas.getContext('2d')!;
    this._bufferGC = this._buffer.getContext('2d')!;
    this._overlayGC = this._overlay.getContext('2d')!;

    // Set up the on-screen canvas.
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0px';
    this._canvas.style.left = '0px';
    this._canvas.style.width = '0px';
    this._canvas.style.height = '0px';

    // Set up the on-screen overlay.
    this._overlay.style.position = 'absolute';
    this._overlay.style.top = '0px';
    this._overlay.style.left = '0px';
    this._overlay.style.width = '0px';
    this._overlay.style.height = '0px';

    // Create the internal widgets for the data grid.
    this._viewport = new Widget();
    this._viewport.node.tabIndex = -1;
    this._viewport.node.style.outline = 'none';
    this._vScrollBar = new ScrollBar({ orientation: 'vertical' });
    this._hScrollBar = new ScrollBar({ orientation: 'horizontal' });
    this._scrollCorner = new Widget();

    this._editorController = new CellEditorController();

    // Add the extra class names to the child widgets.
    this._viewport.addClass('lm-DataGrid-viewport');
    this._vScrollBar.addClass('lm-DataGrid-scrollBar');
    this._hScrollBar.addClass('lm-DataGrid-scrollBar');
    this._scrollCorner.addClass('lm-DataGrid-scrollCorner');

    // Add the on-screen canvas to the viewport node.
    this._viewport.node.appendChild(this._canvas);

    // Add the on-screen overlay to the viewport node.
    this._viewport.node.appendChild(this._overlay);

    // Install the message hooks.
    MessageLoop.installMessageHook(this._viewport, this);
    MessageLoop.installMessageHook(this._hScrollBar, this);
    MessageLoop.installMessageHook(this._vScrollBar, this);

    // Hide the scroll bars and corner from the outset.
    this._vScrollBar.hide();
    this._hScrollBar.hide();
    this._scrollCorner.hide();

    // Connect to the scroll bar signals.
    this._vScrollBar.thumbMoved.connect(this._onThumbMoved, this);
    this._hScrollBar.thumbMoved.connect(this._onThumbMoved, this);
    this._vScrollBar.pageRequested.connect(this._onPageRequested, this);
    this._hScrollBar.pageRequested.connect(this._onPageRequested, this);
    this._vScrollBar.stepRequested.connect(this._onStepRequested, this);
    this._hScrollBar.stepRequested.connect(this._onStepRequested, this);

    // Set the layout cell config for the child widgets.
    GridLayout.setCellConfig(this._viewport, { row: 0, column: 0 });
    GridLayout.setCellConfig(this._vScrollBar, { row: 0, column: 1 });
    GridLayout.setCellConfig(this._hScrollBar, { row: 1, column: 0 });
    GridLayout.setCellConfig(this._scrollCorner, { row: 1, column: 1 });

    // Create the layout for the data grid.
    let layout = new GridLayout({
      rowCount: 2,
      columnCount: 2,
      rowSpacing: 0,
      columnSpacing: 0,
      fitPolicy: 'set-no-constraint'
    });

    // Set the stretch factors for the grid.
    layout.setRowStretch(0, 1);
    layout.setRowStretch(1, 0);
    layout.setColumnStretch(0, 1);
    layout.setColumnStretch(1, 0);

    // Add the child widgets to the layout.
    layout.addWidget(this._viewport);
    layout.addWidget(this._vScrollBar);
    layout.addWidget(this._hScrollBar);
    layout.addWidget(this._scrollCorner);

    // Install the layout on the data grid.
    this.layout = layout;
  }

  /**
   * Dispose of the resources held by the widgets.
   */
  dispose(): void {
    // Release the mouse.
    this._releaseMouse();

    // Dispose of the handlers.
    if (this._keyHandler) {
      this._keyHandler.dispose();
    }
    if (this._mouseHandler) {
      this._mouseHandler.dispose();
    }
    this._keyHandler = null;
    this._mouseHandler = null;

    // Clear the models.
    this._dataModel = null;
    this._selectionModel = null;

    // Clear the section lists.
    this._rowSections.clear();
    this._columnSections.clear();
    this._rowHeaderSections.clear();
    this._columnHeaderSections.clear();

    // Dispose of the base class.
    super.dispose();
  }

  /**
   * Get the data model for the data grid.
   */
  get dataModel(): DataModel | null {
    return this._dataModel;
  }

  /**
   * Set the data model for the data grid.
   *
   * #### Notes
   * This will automatically remove the current selection model.
   */
  set dataModel(value: DataModel | null) {
    // Do nothing if the model does not change.
    if (this._dataModel === value) {
      return;
    }

    // Release the mouse.
    this._releaseMouse();

    // Clear the selection model.
    this.selectionModel = null;

    // Disconnect the change handler from the old model.
    if (this._dataModel) {
      this._dataModel.changed.disconnect(this._onDataModelChanged, this);
    }

    // Connect the change handler for the new model.
    if (value) {
      value.changed.connect(this._onDataModelChanged, this);
    }

    // Update the internal model reference.
    this._dataModel = value;

    // Clear the section lists.
    this._rowSections.clear();
    this._columnSections.clear();
    this._rowHeaderSections.clear();
    this._columnHeaderSections.clear();

    // Populate the section lists.
    if (value) {
      this._rowSections.insert(0, value.rowCount('body'));
      this._columnSections.insert(0, value.columnCount('body'));
      this._rowHeaderSections.insert(0, value.columnCount('row-header'));
      this._columnHeaderSections.insert(0, value.rowCount('column-header'));
    }

    // Reset the scroll position.
    this._scrollX = 0;
    this._scrollY = 0;

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Get the selection model for the data grid.
   */
  get selectionModel(): SelectionModel | null {
    return this._selectionModel;
  }

  /**
   * Set the selection model for the data grid.
   */
  set selectionModel(value: SelectionModel | null) {
    // Do nothing if the selection model does not change.
    if (this._selectionModel === value) {
      return;
    }

    // Release the mouse.
    this._releaseMouse();

    // Ensure the data models are a match.
    if (value && value.dataModel !== this._dataModel) {
      throw new Error('SelectionModel.dataModel !== DataGrid.dataModel');
    }

    // Disconnect the change handler from the old model.
    if (this._selectionModel) {
      this._selectionModel.changed.disconnect(this._onSelectionsChanged, this);
    }

    // Connect the change handler for the new model.
    if (value) {
      value.changed.connect(this._onSelectionsChanged, this);
    }

    // Update the internal selection model reference.
    this._selectionModel = value;

    // Schedule a repaint of the overlay.
    this.repaintOverlay();
  }

  /**
   * Get the key handler for the data grid.
   */
  get keyHandler(): DataGrid.IKeyHandler | null {
    return this._keyHandler;
  }

  /**
   * Set the key handler for the data grid.
   */
  set keyHandler(value: DataGrid.IKeyHandler | null) {
    this._keyHandler = value;
  }

  /**
   * Get the mouse handler for the data grid.
   */
  get mouseHandler(): DataGrid.IMouseHandler | null {
    return this._mouseHandler;
  }

  /**
   * Set the mouse handler for the data grid.
   */
  set mouseHandler(value: DataGrid.IMouseHandler | null) {
    // Bail early if the mouse handler does not change.
    if (this._mouseHandler === value) {
      return;
    }

    // Release the mouse.
    this._releaseMouse();

    // Update the internal mouse handler.
    this._mouseHandler = value;
  }

  /**
   * Get the style for the data grid.
   */
  get style(): DataGrid.Style {
    return this._style;
  }

  /**
   * Set the style for the data grid.
   */
  set style(value: DataGrid.Style) {
    // Bail if the style does not change.
    if (this._style === value) {
      return;
    }

    // Update the internal style.
    this._style = { ...value };

    // Schedule a repaint of the content.
    this.repaintContent();

    // Schedule a repaint of the overlay.
    this.repaintOverlay();
  }

  /**
   * Get the cell renderer map for the data grid.
   */
  get cellRenderers(): RendererMap {
    return this._cellRenderers;
  }

  /**
   * Set the cell renderer map for the data grid.
   */
  set cellRenderers(value: RendererMap) {
    // Bail if the renderer map does not change.
    if (this._cellRenderers === value) {
      return;
    }

    // Disconnect the old map.
    this._cellRenderers.changed.disconnect(this._onRenderersChanged, this);

    // Connect the new map.
    value.changed.connect(this._onRenderersChanged, this);

    // Update the internal renderer map.
    this._cellRenderers = value;

    // Schedule a repaint of the grid content.
    this.repaintContent();
  }

  /**
   * Get the header visibility for the data grid.
   */
  get headerVisibility(): DataGrid.HeaderVisibility {
    return this._headerVisibility;
  }

  /**
   * Set the header visibility for the data grid.
   */
  set headerVisibility(value: DataGrid.HeaderVisibility) {
    // Bail if the visibility does not change.
    if (this._headerVisibility === value) {
      return;
    }

    // Update the internal visibility.
    this._headerVisibility = value;

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Get the default sizes for the various sections of the data grid.
   */
  get defaultSizes(): DataGrid.DefaultSizes {
    let rowHeight = this._rowSections.defaultSize;
    let columnWidth = this._columnSections.defaultSize;
    let rowHeaderWidth = this._rowHeaderSections.defaultSize;
    let columnHeaderHeight = this._columnHeaderSections.defaultSize;
    return { rowHeight, columnWidth, rowHeaderWidth, columnHeaderHeight };
  }

  /**
   * Set the default sizes for the various sections of the data grid.
   */
  set defaultSizes(value: DataGrid.DefaultSizes) {
    // Update the section default sizes.
    this._rowSections.defaultSize = value.rowHeight;
    this._columnSections.defaultSize = value.columnWidth;
    this._rowHeaderSections.defaultSize = value.rowHeaderWidth;
    this._columnHeaderSections.defaultSize = value.columnHeaderHeight;

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Get the minimum sizes for the various sections of the data grid.
   */
  get minimumSizes(): DataGrid.DefaultSizes {
    let rowHeight = this._rowSections.minimumSize;
    let columnWidth = this._columnSections.minimumSize;
    let rowHeaderWidth = this._rowHeaderSections.minimumSize;
    let columnHeaderHeight = this._columnHeaderSections.minimumSize;
    return { rowHeight, columnWidth, rowHeaderWidth, columnHeaderHeight };
  }

  /**
   * Set the minimum sizes for the various sections of the data grid.
   */
  set minimumSizes(value: DataGrid.DefaultSizes) {
    // Update the section default sizes.
    this._rowSections.minimumSize = value.rowHeight;
    this._columnSections.minimumSize = value.columnWidth;
    this._rowHeaderSections.minimumSize = value.rowHeaderWidth;
    this._columnHeaderSections.minimumSize = value.columnHeaderHeight;

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Get the copy configuration for the data grid.
   */
  get copyConfig(): DataGrid.CopyConfig {
    return this._copyConfig;
  }

  /**
   * Set the copy configuration for the data grid.
   */
  set copyConfig(value: DataGrid.CopyConfig) {
    this._copyConfig = value;
  }

  /**
   * Get whether the last row is stretched.
   */
  get stretchLastRow(): boolean {
    return this._stretchLastRow;
  }

  /**
   * Set whether the last row is stretched.
   */
  set stretchLastRow(value: boolean) {
    // Bail early if the value does not change.
    if (value === this._stretchLastRow) {
      return;
    }

    // Update the internal value.
    this._stretchLastRow = value;

    // Sync the viewport
    this._syncViewport();
  }

  /**
   * Get whether the last column is stretched.
   */
  get stretchLastColumn(): boolean {
    return this._stretchLastColumn;
  }

  /**
   * Set whether the last column is stretched.
   */
  set stretchLastColumn(value: boolean) {
    // Bail early if the value does not change.
    if (value === this._stretchLastColumn) {
      return;
    }

    // Update the internal value.
    this._stretchLastColumn = value;

    // Sync the viewport
    this._syncViewport();
  }

  /**
   * The virtual width of the row headers.
   */
  get headerWidth(): number {
    if (this._headerVisibility === 'none') {
      return 0;
    }
    if (this._headerVisibility === 'column') {
      return 0;
    }
    return this._rowHeaderSections.length;
  }

  /**
   * The virtual height of the column headers.
   */
  get headerHeight(): number {
    if (this._headerVisibility === 'none') {
      return 0;
    }
    if (this._headerVisibility === 'row') {
      return 0;
    }
    return this._columnHeaderSections.length;
  }

  /**
   * The virtual width of the grid body.
   *
   * #### Notes
   * This does *not* account for a stretched last column.
   */
  get bodyWidth(): number {
    return this._columnSections.length;
  }

  /**
   * The virtual height of the grid body.
   *
   * #### Notes
   * This does *not* account for a stretched last row.
   */
  get bodyHeight(): number {
    return this._rowSections.length;
  }

  /**
   * The virtual width of the entire grid.
   *
   * #### Notes
   * This does *not* account for a stretched last column.
   */
  get totalWidth(): number {
    return this.headerWidth + this.bodyWidth;
  }

  /**
   * The virtual height of the entire grid.
   *
   * #### Notes
   * This does *not* account for a stretched last row.
   */
  get totalHeight(): number {
    return this.headerHeight + this.bodyHeight;
  }

  /**
   * The actual width of the viewport.
   */
  get viewportWidth(): number {
    return this._viewportWidth;
  }

  /**
   * The actual height of the viewport.
   */
  get viewportHeight(): number {
    return this._viewportHeight;
  }

  /**
   * The width of the visible portion of the grid body.
   */
  get pageWidth(): number {
    return Math.max(0, this.viewportWidth - this.headerWidth);
  }

  /**
   * The height of the visible portion of the grid body.
   */
  get pageHeight(): number {
    return Math.max(0, this.viewportHeight - this.headerHeight);
  }

  /**
   * The current scroll X position of the viewport.
   */
  get scrollX(): number {
    return this._hScrollBar.value;
  }

  /**
   * The current scroll Y position of the viewport.
   */
  get scrollY(): number {
    return this._vScrollBar.value;
  }

  /**
   * The maximum scroll X position for the grid.
   */
  get maxScrollX(): number {
    return Math.max(0, this.bodyWidth - this.pageWidth - 1);
  }

  /**
   * The maximum scroll Y position for the grid.
   */
  get maxScrollY(): number {
    return Math.max(0, this.bodyHeight - this.pageHeight - 1);
  }

  /**
   * The viewport widget for the data grid.
   */
  get viewport(): Widget {
    return this._viewport;
  }

  /**
   * The cell editor controller object for the data grid.
   */
  get editorController(): ICellEditorController | null {
    return this._editorController;
  }

  set editorController(controller: ICellEditorController | null) {
    this._editorController = controller;
  }

  /**
   * Whether the cell editing is enabled for the data grid.
   */
  get editingEnabled(): boolean {
    return this._editingEnabled;
  }

  set editingEnabled(enabled: boolean) {
    this._editingEnabled = enabled;
  }

  /**
   * Whether the grid cells are editable.
   *
   * `editingEnabled` flag must be on and grid must have required
   * selection model, editor controller and data model properties.
   */
  get editable(): boolean {
    return (
      this._editingEnabled &&
      this._selectionModel !== null &&
      this._editorController !== null &&
      this.dataModel instanceof MutableDataModel
    );
  }

  /**
   * The rendering context for painting the data grid.
   */
  protected get canvasGC(): CanvasRenderingContext2D {
    return this._canvasGC;
  }

  /**
   * The row sections of the data grid.
   */
  protected get rowSections(): SectionList {
    return this._rowSections;
  }

  /**
   * The column sections of the data grid.
   */
  protected get columnSections(): SectionList {
    return this._columnSections;
  }

  /**
   * The row header sections of the data grid.
   */
  protected get rowHeaderSections(): SectionList {
    return this._rowHeaderSections;
  }

  /**
   * The column header sections of the data grid.
   */
  protected get columnHeaderSections(): SectionList {
    return this._columnHeaderSections;
  }

  /**
   * Scroll the grid to the specified row.
   *
   * @param row - The row index of the cell.
   *
   * #### Notes
   * This is a no-op if the row is already visible.
   */
  scrollToRow(row: number): void {
    // Fetch the row count.
    let nr = this._rowSections.count;

    // Bail early if there is no content.
    if (nr === 0) {
      return;
    }

    // Floor the row index.
    row = Math.floor(row);

    // Clamp the row index.
    row = Math.max(0, Math.min(row, nr - 1));

    // Get the virtual bounds of the row.
    let y1 = this._rowSections.offsetOf(row);
    let y2 = this._rowSections.extentOf(row);

    // Get the virtual bounds of the viewport.
    let vy1 = this._scrollY;
    let vy2 = this._scrollY + this.pageHeight - 1;

    // Set up the delta variables.
    let dy = 0;

    // Compute the delta Y scroll.
    if (y1 < vy1) {
      dy = y1 - vy1 - 10;
    } else if (y2 > vy2) {
      dy = y2 - vy2 + 10;
    }

    // Bail early if no scroll is needed.
    if (dy === 0) {
      return;
    }

    // Scroll by the computed delta.
    this.scrollBy(0, dy);
  }

  /**
   * Scroll the grid to the specified column.
   *
   * @param column - The column index of the cell.
   *
   * #### Notes
   * This is a no-op if the column is already visible.
   */
  scrollToColumn(column: number): void {
    // Fetch the column count.
    let nc = this._columnSections.count;

    // Bail early if there is no content.
    if (nc === 0) {
      return;
    }

    // Floor the column index.
    column = Math.floor(column);

    // Clamp the column index.
    column = Math.max(0, Math.min(column, nc - 1));

    // Get the virtual bounds of the column.
    let x1 = this._columnSections.offsetOf(column);
    let x2 = this._columnSections.extentOf(column);

    // Get the virtual bounds of the viewport.
    let vx1 = this._scrollX;
    let vx2 = this._scrollX + this.pageWidth - 1;

    // Set up the delta variables.
    let dx = 0;

    // Compute the delta X scroll.
    if (x1 < vx1) {
      dx = x1 - vx1 - 10;
    } else if (x2 > vx2) {
      dx = x2 - vx2 + 10;
    }

    // Bail early if no scroll is needed.
    if (dx === 0) {
      return;
    }

    // Scroll by the computed delta.
    this.scrollBy(dx, 0);
  }

  /**
   * Scroll the grid to the specified cell.
   *
   * @param row - The row index of the cell.
   *
   * @param column - The column index of the cell.
   *
   * #### Notes
   * This is a no-op if the cell is already visible.
   */
  scrollToCell(row: number, column: number): void {
    // Fetch the row and column count.
    let nr = this._rowSections.count;
    let nc = this._columnSections.count;

    // Bail early if there is no content.
    if (nr === 0 || nc === 0) {
      return;
    }

    // Floor the cell index.
    row = Math.floor(row);
    column = Math.floor(column);

    // Clamp the cell index.
    row = Math.max(0, Math.min(row, nr - 1));
    column = Math.max(0, Math.min(column, nc - 1));

    // Get the virtual bounds of the cell.
    let x1 = this._columnSections.offsetOf(column);
    let x2 = this._columnSections.extentOf(column);
    let y1 = this._rowSections.offsetOf(row);
    let y2 = this._rowSections.extentOf(row);

    // Get the virtual bounds of the viewport.
    let vx1 = this._scrollX;
    let vx2 = this._scrollX + this.pageWidth - 1;
    let vy1 = this._scrollY;
    let vy2 = this._scrollY + this.pageHeight - 1;

    // Set up the delta variables.
    let dx = 0;
    let dy = 0;

    // Compute the delta X scroll.
    if (x1 < vx1) {
      dx = x1 - vx1 - 10;
    } else if (x2 > vx2) {
      dx = x2 - vx2 + 10;
    }

    // Compute the delta Y scroll.
    if (y1 < vy1) {
      dy = y1 - vy1 - 10;
    } else if (y2 > vy2) {
      dy = y2 - vy2 + 10;
    }

    // Bail early if no scroll is needed.
    if (dx === 0 && dy === 0) {
      return;
    }

    // Scroll by the computed delta.
    this.scrollBy(dx, dy);
  }

  /**
   * Move cursor down/up/left/right while making sure it remains
   * within the bounds of selected rectangles
   *
   * @param direction - The direction of the movement.
   */
  moveCursor(direction: SelectionModel.CursorMoveDirection): void {
    // Bail early if there is no selection
    if (
      !this.dataModel ||
      !this._selectionModel ||
      this._selectionModel.isEmpty
    ) {
      return;
    }

    const iter = this._selectionModel.selections();
    const onlyOne = iter.next() && !iter.next();

    // if there is a single selection that is a single cell selection
    // then move the selection and cursor within grid bounds
    if (onlyOne) {
      const currentSel = this._selectionModel.currentSelection()!;
      if (currentSel.r1 === currentSel.r2 && currentSel.c1 === currentSel.c2) {
        const dr = direction === 'down' ? 1 : direction === 'up' ? -1 : 0;
        const dc = direction === 'right' ? 1 : direction === 'left' ? -1 : 0;
        let newRow = currentSel.r1 + dr;
        let newColumn = currentSel.c1 + dc;
        const rowCount = this.dataModel.rowCount('body');
        const columnCount = this.dataModel.columnCount('body');
        if (newRow >= rowCount) {
          newRow = 0;
          newColumn += 1;
        } else if (newRow === -1) {
          newRow = rowCount - 1;
          newColumn -= 1;
        }
        if (newColumn >= columnCount) {
          newColumn = 0;
          newRow += 1;
          if (newRow >= rowCount) {
            newRow = 0;
          }
        } else if (newColumn === -1) {
          newColumn = columnCount - 1;
          newRow -= 1;
          if (newRow === -1) {
            newRow = rowCount - 1;
          }
        }

        this._selectionModel.select({
          r1: newRow,
          c1: newColumn,
          r2: newRow,
          c2: newColumn,
          cursorRow: newRow,
          cursorColumn: newColumn,
          clear: 'all'
        });

        return;
      }
    }

    // if there are multiple selections, move cursor
    // within selection rectangles
    this._selectionModel.moveCursorWithinSelections(direction);
  }

  /**
   * Scroll the grid to the current cursor position.
   *
   * #### Notes
   * This is a no-op if the cursor is already visible or
   * if there is no selection model installed on the grid.
   */
  scrollToCursor(): void {
    // Bail early if there is no selection model.
    if (!this._selectionModel) {
      return;
    }

    // Fetch the cursor row and column.
    let row = this._selectionModel.cursorRow;
    let column = this._selectionModel.cursorColumn;

    // Scroll to the cursor cell.
    this.scrollToCell(row, column);
  }

  /**
   * Scroll the viewport by the specified amount.
   *
   * @param dx - The X scroll amount.
   *
   * @param dy - The Y scroll amount.
   */
  scrollBy(dx: number, dy: number): void {
    this.scrollTo(this.scrollX + dx, this.scrollY + dy);
  }

  /**
   * Scroll the viewport by one page.
   *
   * @param dir - The desired direction of the scroll.
   */
  scrollByPage(dir: 'up' | 'down' | 'left' | 'right'): void {
    let dx = 0;
    let dy = 0;
    switch (dir) {
      case 'up':
        dy = -this.pageHeight;
        break;
      case 'down':
        dy = this.pageHeight;
        break;
      case 'left':
        dx = -this.pageWidth;
        break;
      case 'right':
        dx = this.pageWidth;
        break;
      default:
        throw 'unreachable';
    }
    this.scrollTo(this.scrollX + dx, this.scrollY + dy);
  }

  /**
   * Scroll the viewport by one cell-aligned step.
   *
   * @param dir - The desired direction of the scroll.
   */
  scrollByStep(dir: 'up' | 'down' | 'left' | 'right'): void {
    let r: number;
    let c: number;
    let x = this.scrollX;
    let y = this.scrollY;
    let rows = this._rowSections;
    let columns = this._columnSections;
    switch (dir) {
      case 'up':
        r = rows.indexOf(y - 1);
        y = r < 0 ? y : rows.offsetOf(r);
        break;
      case 'down':
        r = rows.indexOf(y);
        y = r < 0 ? y : rows.offsetOf(r) + rows.sizeOf(r);
        break;
      case 'left':
        c = columns.indexOf(x - 1);
        x = c < 0 ? x : columns.offsetOf(c);
        break;
      case 'right':
        c = columns.indexOf(x);
        x = c < 0 ? x : columns.offsetOf(c) + columns.sizeOf(c);
        break;
      default:
        throw 'unreachable';
    }
    this.scrollTo(x, y);
  }

  /**
   * Scroll to the specified offset position.
   *
   * @param x - The desired X position.
   *
   * @param y - The desired Y position.
   */
  scrollTo(x: number, y: number): void {
    // Floor and clamp the position to the allowable range.
    x = Math.max(0, Math.min(Math.floor(x), this.maxScrollX));
    y = Math.max(0, Math.min(Math.floor(y), this.maxScrollY));

    // Update the scroll bar values with the desired position.
    this._hScrollBar.value = x;
    this._vScrollBar.value = y;

    // Post a scroll request message to the viewport.
    MessageLoop.postMessage(this._viewport, Private.ScrollRequest);
  }

  /**
   * Get the row count for a particular region in the data grid.
   *
   * @param region - The row region of interest.
   *
   * @returns The row count for the specified region.
   */
  rowCount(region: DataModel.RowRegion): number {
    let count: number;
    if (region === 'body') {
      count = this._rowSections.count;
    } else {
      count = this._columnHeaderSections.count;
    }
    return count;
  }

  /**
   * Get the column count for a particular region in the data grid.
   *
   * @param region - The column region of interest.
   *
   * @returns The column count for the specified region.
   */
  columnCount(region: DataModel.ColumnRegion): number {
    let count: number;
    if (region === 'body') {
      count = this._columnSections.count;
    } else {
      count = this._rowHeaderSections.count;
    }
    return count;
  }

  /**
   * Get the row at a virtual offset in the data grid.
   *
   * @param region - The region which holds the row of interest.
   *
   * @param offset - The virtual offset of the row of interest.
   *
   * @returns The index of the row, or `-1` if the offset is out of range.
   *
   * #### Notes
   * This method accounts for a stretched last row.
   */
  rowAt(region: DataModel.RowRegion, offset: number): number {
    // Bail early if the offset is negative.
    if (offset < 0) {
      return -1;
    }

    // Return early for the column header region.
    if (region === 'column-header') {
      return this._columnHeaderSections.indexOf(offset);
    }

    // Fetch the index.
    let index = this._rowSections.indexOf(offset);

    // Return early if the section is found.
    if (index >= 0) {
      return index;
    }

    // Bail early if the last row is not stretched.
    if (!this._stretchLastRow) {
      return -1;
    }

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let ph = this.pageHeight;

    // Bail early if no row stretching is required.
    if (ph <= bh) {
      return -1;
    }

    // Bail early if the offset is out of bounds.
    if (offset >= ph) {
      return -1;
    }

    // Otherwise, return the last row.
    return this._rowSections.count - 1;
  }

  /**
   * Get the column at a virtual offset in the data grid.
   *
   * @param region - The region which holds the column of interest.
   *
   * @param offset - The virtual offset of the column of interest.
   *
   * @returns The index of the column, or `-1` if the offset is out of range.
   *
   * #### Notes
   * This method accounts for a stretched last column.
   */
  columnAt(region: DataModel.ColumnRegion, offset: number): number {
    if (offset < 0) {
      return -1;
    }

    // Return early for the row header region.
    if (region === 'row-header') {
      return this._rowHeaderSections.indexOf(offset);
    }

    // Fetch the index.
    let index = this._columnSections.indexOf(offset);

    // Return early if the section is found.
    if (index >= 0) {
      return index;
    }

    // Bail early if the last column is not stretched.
    if (!this._stretchLastColumn) {
      return -1;
    }

    // Fetch the geometry.
    let bw = this.bodyWidth;
    let pw = this.pageWidth;

    // Bail early if no column stretching is required.
    if (pw <= bw) {
      return -1;
    }

    // Bail early if the offset is out of bounds.
    if (offset >= pw) {
      return -1;
    }

    // Otherwise, return the last column.
    return this._columnSections.count - 1;
  }

  /**
   * Get the offset of a row in the data grid.
   *
   * @param region - The region which holds the row of interest.
   *
   * @param index - The index of the row of interest.
   *
   * @returns The offset of the row, or `-1` if the index is out of range.
   *
   * #### Notes
   * A stretched last row has no effect on the return value.
   */
  rowOffset(region: DataModel.RowRegion, index: number): number {
    let offset: number;
    if (region === 'body') {
      offset = this._rowSections.offsetOf(index);
    } else {
      offset = this._columnHeaderSections.offsetOf(index);
    }
    return offset;
  }

  /**
   * Get the offset of a column in the data grid.
   *
   * @param region - The region which holds the column of interest.
   *
   * @param index - The index of the column of interest.
   *
   * @returns The offset of the column, or `-1` if the index is out of range.
   *
   * #### Notes
   * A stretched last column has no effect on the return value.
   */
  columnOffset(region: DataModel.ColumnRegion, index: number): number {
    let offset: number;
    if (region === 'body') {
      offset = this._columnSections.offsetOf(index);
    } else {
      offset = this._rowHeaderSections.offsetOf(index);
    }
    return offset;
  }

  /**
   * Get the size of a row in the data grid.
   *
   * @param region - The region which holds the row of interest.
   *
   * @param index - The index of the row of interest.
   *
   * @returns The size of the row, or `-1` if the index is out of range.
   *
   * #### Notes
   * This method accounts for a stretched last row.
   */
  rowSize(region: DataModel.RowRegion, index: number): number {
    // Return early for the column header region.
    if (region === 'column-header') {
      return this._columnHeaderSections.sizeOf(index);
    }

    // Fetch the row size.
    let size = this._rowSections.sizeOf(index);

    // Bail early if the index is out of bounds.
    if (size < 0) {
      return size;
    }

    // Return early if the last row is not stretched.
    if (!this._stretchLastRow) {
      return size;
    }

    // Return early if its not the last row.
    if (index < this._rowSections.count - 1) {
      return size;
    }

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let ph = this.pageHeight;

    // Return early if no stretching is needed.
    if (ph <= bh) {
      return size;
    }

    // Return the adjusted size.
    return size + (ph - bh);
  }

  /**
   * Get the size of a column in the data grid.
   *
   * @param region - The region which holds the column of interest.
   *
   * @param index - The index of the column of interest.
   *
   * @returns The size of the column, or `-1` if the index is out of range.
   *
   * #### Notes
   * This method accounts for a stretched last column.
   */
  columnSize(region: DataModel.ColumnRegion, index: number): number {
    // Return early for the row header region.
    if (region === 'row-header') {
      return this._rowHeaderSections.sizeOf(index);
    }

    // Fetch the column size.
    let size = this._columnSections.sizeOf(index);

    // Bail early if the index is out of bounds.
    if (size < 0) {
      return size;
    }

    // Return early if the last column is not stretched.
    if (!this._stretchLastColumn) {
      return size;
    }

    // Return early if its not the last column.
    if (index < this._columnSections.count - 1) {
      return size;
    }

    // Fetch the geometry.
    let bw = this.bodyWidth;
    let pw = this.pageWidth;

    // Return early if no stretching is needed.
    if (pw <= bw) {
      return size;
    }

    // Return the adjusted size.
    return size + (pw - bw);
  }

  /**
   * Resize a row in the data grid.
   *
   * @param region - The region which holds the row of interest.
   *
   * @param index - The index of the row of interest.
   *
   * @param size - The desired size of the row.
   */
  resizeRow(region: DataModel.RowRegion, index: number, size: number): void {
    let msg = new Private.RowResizeRequest(region, index, size);
    MessageLoop.postMessage(this._viewport, msg);
  }

  /**
   * Resize a column in the data grid.
   *
   * @param region - The region which holds the column of interest.
   *
   * @param index - The index of the column of interest.
   *
   * @param size - The desired size of the column.
   */
  resizeColumn(
    region: DataModel.ColumnRegion,
    index: number,
    size: number
  ): void {
    let msg = new Private.ColumnResizeRequest(region, index, size);
    MessageLoop.postMessage(this._viewport, msg);
  }

  /**
   * Reset modified rows to their default size.
   *
   * @param region - The row region of interest.
   */
  resetRows(region: DataModel.RowRegion | 'all'): void {
    switch (region) {
      case 'all':
        this._rowSections.reset();
        this._columnHeaderSections.reset();
        break;
      case 'body':
        this._rowSections.reset();
        break;
      case 'column-header':
        this._columnHeaderSections.reset();
        break;
      default:
        throw 'unreachable';
    }
    this.repaintContent();
    this.repaintOverlay();
  }

  /**
   * Reset modified columns to their default size.
   *
   * @param region - The column region of interest.
   */
  resetColumns(region: DataModel.ColumnRegion | 'all'): void {
    switch (region) {
      case 'all':
        this._columnSections.reset();
        this._rowHeaderSections.reset();
        break;
      case 'body':
        this._columnSections.reset();
        break;
      case 'row-header':
        this._rowHeaderSections.reset();
        break;
      default:
        throw 'unreachable';
    }
    this.repaintContent();
    this.repaintOverlay();
  }

  /**
   * Auto sizes column widths based on their text content.
   * @param area which area to resize: 'body', 'row-header' or 'all'.
   * @param padding padding added to resized columns (pixels).
   * @param numCols specify cap on the number of column resizes (optional).
   */
  fitColumnNames(
    area: DataGrid.ColumnFitType = 'all',
    padding: number = 15,
    numCols?: number
  ): void {
    // Attempt resizing only if a data model is present.
    if (this.dataModel) {
      // Tracking remaining columns to be resized if numCols arg passed.
      let colsRemaining =
        numCols === undefined || numCols < 0 ? undefined : numCols;

      if (area === 'row-header' || area === 'all') {
        // Respecting any column resize cap, if one has been passed.
        if (colsRemaining !== undefined) {
          const rowColumnCount = this.dataModel.columnCount('row-header');
          /*
            If we have more row-header columns than columns available
            for resize, resize only remaining columns as per allowance
            and set remaining resize allowance number to 0.
          */
          if (colsRemaining - rowColumnCount < 0) {
            this._fitRowColumnHeaders(this.dataModel, padding, colsRemaining);
            colsRemaining = 0;
          } else {
            /*
              Otherwise the entire row-header column count can be resized.
              Resize all row-header columns and subtract from remaining
              column resize allowance.
            */
            this._fitRowColumnHeaders(this.dataModel, padding, rowColumnCount);
            colsRemaining = colsRemaining - rowColumnCount;
          }
        } else {
          // No column resize cap passed - resizing all columns.
          this._fitRowColumnHeaders(this.dataModel, padding);
        }
      }

      if (area === 'body' || area === 'all') {
        // Respecting any column resize cap, if one has been passed.
        if (colsRemaining !== undefined) {
          const bodyColumnCount = this.dataModel.columnCount('body');
          /*
            If we have more body columns than columns available
            for resize, resize only remaining columns as per allowance
            and set remaining resize allowance number to 0.
          */
          if (colsRemaining - bodyColumnCount < 0) {
            this._fitBodyColumnHeaders(this.dataModel, padding, colsRemaining);
            colsRemaining = 0;
          } else {
            /*
              Otherwise the entire body column count can be resized.
              Resize based on the smallest number between remaining
              resize allowance and body column count.
            */
            this._fitBodyColumnHeaders(
              this.dataModel,
              padding,
              Math.min(colsRemaining, bodyColumnCount)
            );
          }
        } else {
          // No column resize cap passed - resizing all columns.
          this._fitBodyColumnHeaders(this.dataModel, padding);
        }
      }
    }
  }

  /**
   * Map a client position to local viewport coordinates.
   *
   * @param clientX - The client X position of the mouse.
   *
   * @param clientY - The client Y position of the mouse.
   *
   * @returns The local viewport coordinates for the position.
   */
  mapToLocal(clientX: number, clientY: number): { lx: number; ly: number } {
    // Fetch the viewport rect.
    let rect = this._viewport.node.getBoundingClientRect();

    // Extract the rect coordinates.
    let { left, top } = rect;

    // Round the rect coordinates for sub-pixel positioning.
    left = Math.floor(left);
    top = Math.floor(top);

    // Convert to local coordinates.
    let lx = clientX - left;
    let ly = clientY - top;

    // Return the local coordinates.
    return { lx, ly };
  }

  /**
   * Map a client position to virtual grid coordinates.
   *
   * @param clientX - The client X position of the mouse.
   *
   * @param clientY - The client Y position of the mouse.
   *
   * @returns The virtual grid coordinates for the position.
   */
  mapToVirtual(clientX: number, clientY: number): { vx: number; vy: number } {
    // Convert to local coordiates.
    let { lx, ly } = this.mapToLocal(clientX, clientY);

    // Convert to virtual coordinates.
    let vx = lx + this.scrollX - this.headerWidth;
    let vy = ly + this.scrollY - this.headerHeight;

    // Return the local coordinates.
    return { vx, vy };
  }

  /**
   * Hit test the viewport for the given client position.
   *
   * @param clientX - The client X position of the mouse.
   *
   * @param clientY - The client Y position of the mouse.
   *
   * @returns The hit test result, or `null` if the client
   *   position is out of bounds.
   *
   * #### Notes
   * This method accounts for a stretched last row and/or column.
   */
  hitTest(clientX: number, clientY: number): DataGrid.HitTestResult {
    // Convert the mouse position into local coordinates.
    let { lx, ly } = this.mapToLocal(clientX, clientY);

    // Fetch the header and body dimensions.
    let hw = this.headerWidth;
    let hh = this.headerHeight;
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;
    let ph = this.pageHeight;
    let pw = this.pageWidth;

    // Adjust the body width for a stretched last column.
    if (this._stretchLastColumn && pw > bw) {
      bw = pw;
    }

    // Adjust the body height for a stretched last row.
    if (this._stretchLastRow && ph > bh) {
      bh = ph;
    }

    // Check for a corner header hit.
    if (lx >= 0 && lx < hw && ly >= 0 && ly < hh) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx;
      let vy = ly;

      // Fetch the row and column index.
      let row = this.rowAt('column-header', vy);
      let column = this.columnAt('row-header', vx);

      // Fetch the cell offset position.
      let ox = this.columnOffset('row-header', column);
      let oy = this.rowOffset('column-header', row);

      // Fetch cell width and height.
      let width = this.columnSize('row-header', column);
      let height = this.rowSize('column-header', row);

      // Compute the leading and trailing positions.
      let x = vx - ox;
      let y = vy - oy;

      // Return the hit test result.
      return { region: 'corner-header', row, column, x, y, width, height };
    }

    // Check for a column header hit.
    if (ly >= 0 && ly < hh && lx >= 0 && lx < hw + bw) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx + this._scrollX - hw;
      let vy = ly;

      // Fetch the row and column index.
      let row = this.rowAt('column-header', vy);
      let column = this.columnAt('body', vx);

      // Fetch the cell offset position.
      let ox = this.columnOffset('body', column);
      let oy = this.rowOffset('column-header', row);

      // Fetch the cell width and height.
      let width = this.columnSize('body', column);
      let height = this.rowSize('column-header', row);

      // Compute the leading and trailing positions.
      let x = vx - ox;
      let y = vy - oy;

      // Return the hit test result.
      return { region: 'column-header', row, column, x, y, width, height };
    }

    // Check for a row header hit.
    if (lx >= 0 && lx < hw && ly >= 0 && ly < hh + bh) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx;
      let vy = ly + this._scrollY - hh;

      // Fetch the row and column index.
      let row = this.rowAt('body', vy);
      let column = this.columnAt('row-header', vx);

      // Fetch the cell offset position.
      let ox = this.columnOffset('row-header', column);
      let oy = this.rowOffset('body', row);

      // Fetch the cell width and height.
      let width = this.columnSize('row-header', column);
      let height = this.rowSize('body', row);

      // Compute the leading and trailing positions.
      let x = vx - ox;
      let y = vy - oy;

      // Return the hit test result.
      return { region: 'row-header', row, column, x, y, width, height };
    }

    // Check for a body hit.
    if (lx >= hw && lx < hw + bw && ly >= hh && ly < hh + bh) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx + this._scrollX - hw;
      let vy = ly + this._scrollY - hh;

      // Fetch the row and column index.
      let row = this.rowAt('body', vy);
      let column = this.columnAt('body', vx);

      // Fetch the cell offset position.
      let ox = this.columnOffset('body', column);
      let oy = this.rowOffset('body', row);

      // Fetch the cell width and height.
      let width = this.columnSize('body', column);
      let height = this.rowSize('body', row);

      // Compute the part coordinates.
      let x = vx - ox;
      let y = vy - oy;

      // Return the result.
      return { region: 'body', row, column, x, y, width, height };
    }

    // Otherwise, it's a void space hit.
    let row = -1;
    let column = -1;
    let x = -1;
    let y = -1;
    let width = -1;
    let height = -1;

    // Return the hit test result.
    return { region: 'void', row, column, x, y, width, height };
  }

  /**
   * Copy the current selection to the system clipboard.
   *
   * #### Notes
   * The grid must have a data model and a selection model.
   *
   * The behavior can be configured via `DataGrid.copyConfig`.
   */
  copyToClipboard(): void {
    // Fetch the data model.
    let dataModel = this._dataModel;

    // Bail early if there is no data model.
    if (!dataModel) {
      return;
    }

    // Fetch the selection model.
    let selectionModel = this._selectionModel;

    // Bail early if there is no selection model.
    if (!selectionModel) {
      return;
    }

    // Coerce the selections to an array.
    let selections = Array.from(selectionModel.selections());

    // Bail early if there are no selections.
    if (selections.length === 0) {
      return;
    }

    // Alert that multiple selections cannot be copied.
    if (selections.length > 1) {
      alert('Cannot copy multiple grid selections.');
      return;
    }

    // Fetch the model counts.
    let br = dataModel.rowCount('body');
    let bc = dataModel.columnCount('body');

    // Bail early if there is nothing to copy.
    if (br === 0 || bc === 0) {
      return;
    }

    // Unpack the selection.
    let { r1, c1, r2, c2 } = selections[0];

    // Clamp the selection to the model bounds.
    r1 = Math.max(0, Math.min(r1, br - 1));
    c1 = Math.max(0, Math.min(c1, bc - 1));
    r2 = Math.max(0, Math.min(r2, br - 1));
    c2 = Math.max(0, Math.min(c2, bc - 1));

    // Ensure the limits are well-orderd.
    if (r2 < r1) [r1, r2] = [r2, r1];
    if (c2 < c1) [c1, c2] = [c2, c1];

    // Fetch the header counts.
    let rhc = dataModel.columnCount('row-header');
    let chr = dataModel.rowCount('column-header');

    // Unpack the copy config.
    let separator = this._copyConfig.separator;
    let format = this._copyConfig.format;
    let headers = this._copyConfig.headers;
    let warningThreshold = this._copyConfig.warningThreshold;

    // Compute the number of cells to be copied.
    let rowCount = r2 - r1 + 1;
    let colCount = c2 - c1 + 1;
    switch (headers) {
      case 'none':
        rhc = 0;
        chr = 0;
        break;
      case 'row':
        chr = 0;
        colCount += rhc;
        break;
      case 'column':
        rhc = 0;
        rowCount += chr;
        break;
      case 'all':
        rowCount += chr;
        colCount += rhc;
        break;
      default:
        throw 'unreachable';
    }

    // Compute the total cell count.
    let cellCount = rowCount * colCount;

    // Allow the user to cancel a large copy request.
    if (cellCount > warningThreshold) {
      let msg = `Copying ${cellCount} cells may take a while. Continue?`;
      if (!window.confirm(msg)) {
        return;
      }
    }

    // Set up the format args.
    let args = {
      region: 'body' as DataModel.CellRegion,
      row: 0,
      column: 0,
      value: null as any,
      metadata: {} as DataModel.Metadata
    };

    // Allocate the array of rows.
    let rows = new Array<string[]>(rowCount);

    // Iterate over the rows.
    for (let j = 0; j < rowCount; ++j) {
      // Allocate the array of cells.
      let cells = new Array<string>(colCount);

      // Iterate over the columns.
      for (let i = 0; i < colCount; ++i) {
        // Set up the format variables.
        let region: DataModel.CellRegion;
        let row: number;
        let column: number;

        // Populate the format variables.
        if (j < chr && i < rhc) {
          region = 'corner-header';
          row = j;
          column = i;
        } else if (j < chr) {
          region = 'column-header';
          row = j;
          column = i - rhc + c1;
        } else if (i < rhc) {
          region = 'row-header';
          row = j - chr + r1;
          column = i;
        } else {
          region = 'body';
          row = j - chr + r1;
          column = i - rhc + c1;
        }

        // Populate the format args.
        args.region = region;
        args.row = row;
        args.column = column;
        args.value = dataModel.data(region, row, column);
        args.metadata = dataModel.metadata(region, row, column);

        // Format the cell.
        cells[i] = format(args);
      }

      // Save the row of cells.
      rows[j] = cells;
    }

    // Convert the cells into lines.
    let lines = rows.map(cells => cells.join(separator));

    // Convert the lines into text.
    let text = lines.join('\n');

    // Copy the text to the clipboard.
    ClipboardExt.copyText(text);
  }

  /**
   * Process a message sent to the widget.
   *
   * @param msg - The message sent to the widget.
   */
  processMessage(msg: Message): void {
    // Ignore child show/hide messages. The data grid controls the
    // visibility of its children, and will manually dispatch the
    // fit-request messages as a result of visibility change.
    if (msg.type === 'child-shown' || msg.type === 'child-hidden') {
      return;
    }

    // Recompute the scroll bar minimums before the layout refits.
    if (msg.type === 'fit-request') {
      let vsbLimits = ElementExt.sizeLimits(this._vScrollBar.node);
      let hsbLimits = ElementExt.sizeLimits(this._hScrollBar.node);
      this._vScrollBarMinWidth = vsbLimits.minWidth;
      this._hScrollBarMinHeight = hsbLimits.minHeight;
    }

    // Process all other messages as normal.
    super.processMessage(msg);
  }

  /**
   * Intercept a message sent to a message handler.
   *
   * @param handler - The target handler of the message.
   *
   * @param msg - The message to be sent to the handler.
   *
   * @returns `true` if the message should continue to be processed
   *   as normal, or `false` if processing should cease immediately.
   */
  messageHook(handler: IMessageHandler, msg: Message): boolean {
    // Process viewport messages.
    if (handler === this._viewport) {
      this._processViewportMessage(msg);
      return true;
    }

    // Process horizontal scroll bar messages.
    if (handler === this._hScrollBar && msg.type === 'activate-request') {
      this.activate();
      return false;
    }

    // Process vertical scroll bar messages.
    if (handler === this._vScrollBar && msg.type === 'activate-request') {
      this.activate();
      return false;
    }

    // Ignore all other messages.
    return true;
  }

  /**
   * Handle the DOM events for the data grid.
   *
   * @param event - The DOM event sent to the data grid.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the data grid's DOM node. It
   * should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
      case 'mousedown':
        this._evtMouseDown(event as MouseEvent);
        break;
      case 'mousemove':
        this._evtMouseMove(event as MouseEvent);
        break;
      case 'mouseup':
        this._evtMouseUp(event as MouseEvent);
        break;
      case 'dblclick':
        this._evtMouseDoubleClick(event as MouseEvent);
        break;
      case 'mouseleave':
        this._evtMouseLeave(event as MouseEvent);
        break;
      case 'contextmenu':
        this._evtContextMenu(event as MouseEvent);
        break;
      case 'wheel':
        this._evtWheel(event as WheelEvent);
        break;
      case 'resize':
        this._refreshDPI();
        break;
    }
  }

  /**
   * A message handler invoked on an `'activate-request'` message.
   */
  protected onActivateRequest(msg: Message): void {
    this.viewport.node.focus({ preventScroll: true });
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    window.addEventListener('resize', this);
    this.node.addEventListener('wheel', this);
    this._viewport.node.addEventListener('keydown', this);
    this._viewport.node.addEventListener('mousedown', this);
    this._viewport.node.addEventListener('mousemove', this);
    this._viewport.node.addEventListener('dblclick', this);
    this._viewport.node.addEventListener('mouseleave', this);
    this._viewport.node.addEventListener('contextmenu', this);
    this.repaintContent();
    this.repaintOverlay();
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    window.removeEventListener('resize', this);
    this.node.removeEventListener('wheel', this);
    this._viewport.node.removeEventListener('keydown', this);
    this._viewport.node.removeEventListener('mousedown', this);
    this._viewport.node.removeEventListener('mousemove', this);
    this._viewport.node.removeEventListener('mouseleave', this);
    this._viewport.node.removeEventListener('dblclick', this);
    this._viewport.node.removeEventListener('contextmenu', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    this.repaintContent();
    this.repaintOverlay();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this._editorController) {
      this._editorController.cancel();
    }

    this._syncScrollState();
  }

  /**
   * Schedule a repaint of all of the grid content.
   */
  protected repaintContent(): void {
    let msg = new Private.PaintRequest('all', 0, 0, 0, 0);
    MessageLoop.postMessage(this._viewport, msg);
  }

  /**
   * Schedule a repaint of specific grid content.
   */
  protected repaintRegion(
    region: DataModel.CellRegion,
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): void {
    let msg = new Private.PaintRequest(region, r1, c1, r2, c2);
    MessageLoop.postMessage(this._viewport, msg);
  }

  /**
   * Schedule a repaint of the overlay.
   */
  protected repaintOverlay(): void {
    MessageLoop.postMessage(this._viewport, Private.OverlayPaintRequest);
  }

  /**
   * Ensure the canvas is at least the specified size.
   *
   * This method will retain the valid canvas content.
   */
  private _resizeCanvasIfNeeded(width: number, height: number): void {
    // Scale the size by the dpi ratio.
    width = width * this._dpiRatio;
    height = height * this._dpiRatio;

    // Compute the maximum canvas size for the given width and height.
    let maxW = (Math.ceil((width + 1) / 512) + 1) * 512;
    let maxH = (Math.ceil((height + 1) / 512) + 1) * 512;

    // Get the current size of the canvas.
    let curW = this._canvas.width;
    let curH = this._canvas.height;

    // Bail early if the canvas size is within bounds.
    if (curW >= width && curH >= height && curW <= maxW && curH <= maxH) {
      return;
    }

    // Compute the expanded canvas size.
    let expW = maxW - 512;
    let expH = maxH - 512;

    // Set the transforms to the identity matrix.
    this._canvasGC.setTransform(1, 0, 0, 1, 0, 0);
    this._bufferGC.setTransform(1, 0, 0, 1, 0, 0);
    this._overlayGC.setTransform(1, 0, 0, 1, 0, 0);

    // Resize the buffer if needed.
    if (curW < width) {
      this._buffer.width = expW;
    } else if (curW > maxW) {
      this._buffer.width = maxW;
    }

    // Resize the buffer height if needed.
    if (curH < height) {
      this._buffer.height = expH;
    } else if (curH > maxH) {
      this._buffer.height = maxH;
    }

    // Test whether there is content to blit.
    let needBlit = curH > 0 && curH > 0 && width > 0 && height > 0;

    // Copy the valid canvas content into the buffer if needed.
    if (needBlit) {
      this._bufferGC.drawImage(this._canvas, 0, 0);
    }

    // Resize the canvas width if needed.
    if (curW < width) {
      this._canvas.width = expW;
      this._canvas.style.width = `${expW / this._dpiRatio}px`;
    } else if (curW > maxW) {
      this._canvas.width = maxW;
      this._canvas.style.width = `${maxW / this._dpiRatio}px`;
    }

    // Resize the canvas height if needed.
    if (curH < height) {
      this._canvas.height = expH;
      this._canvas.style.height = `${expH / this._dpiRatio}px`;
    } else if (curH > maxH) {
      this._canvas.height = maxH;
      this._canvas.style.height = `${maxH / this._dpiRatio}px`;
    }

    // Copy the valid canvas content from the buffer if needed.
    if (needBlit) {
      this._canvasGC.drawImage(this._buffer, 0, 0);
    }

    // Copy the valid overlay content into the buffer if needed.
    if (needBlit) {
      this._bufferGC.drawImage(this._overlay, 0, 0);
    }

    // Resize the overlay width if needed.
    if (curW < width) {
      this._overlay.width = expW;
      this._overlay.style.width = `${expW / this._dpiRatio}px`;
    } else if (curW > maxW) {
      this._overlay.width = maxW;
      this._overlay.style.width = `${maxW / this._dpiRatio}px`;
    }

    // Resize the overlay height if needed.
    if (curH < height) {
      this._overlay.height = expH;
      this._overlay.style.height = `${expH / this._dpiRatio}px`;
    } else if (curH > maxH) {
      this._overlay.height = maxH;
      this._overlay.style.height = `${maxH / this._dpiRatio}px`;
    }

    // Copy the valid overlay content from the buffer if needed.
    if (needBlit) {
      this._overlayGC.drawImage(this._buffer, 0, 0);
    }
  }

  /**
   * Sync the scroll bars and scroll state with the viewport.
   *
   * #### Notes
   * If the visibility of either scroll bar changes, a synchronous
   * fit-request will be dispatched to the data grid to immediately
   * resize the viewport.
   */
  private _syncScrollState(): void {
    // Fetch the viewport dimensions.
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;
    let pw = this.pageWidth;
    let ph = this.pageHeight;

    // Get the current scroll bar visibility.
    let hasVScroll = !this._vScrollBar.isHidden;
    let hasHScroll = !this._hScrollBar.isHidden;

    // Get the minimum sizes of the scroll bars.
    let vsw = this._vScrollBarMinWidth;
    let hsh = this._hScrollBarMinHeight;

    // Get the page size as if no scroll bars are visible.
    let apw = pw + (hasVScroll ? vsw : 0);
    let aph = ph + (hasHScroll ? hsh : 0);

    // Test whether scroll bars are needed for the adjusted size.
    let needVScroll = aph < bh - 1;
    let needHScroll = apw < bw - 1;

    // Re-test the horizontal scroll if a vertical scroll is needed.
    if (needVScroll && !needHScroll) {
      needHScroll = apw - vsw < bw - 1;
    }

    // Re-test the vertical scroll if a horizontal scroll is needed.
    if (needHScroll && !needVScroll) {
      needVScroll = aph - hsh < bh - 1;
    }

    // If the visibility changes, immediately refit the grid.
    if (needVScroll !== hasVScroll || needHScroll !== hasHScroll) {
      this._vScrollBar.setHidden(!needVScroll);
      this._hScrollBar.setHidden(!needHScroll);
      this._scrollCorner.setHidden(!needVScroll || !needHScroll);
      MessageLoop.sendMessage(this, Widget.Msg.FitRequest);
    }

    // Update the scroll bar limits.
    this._vScrollBar.maximum = this.maxScrollY;
    this._vScrollBar.page = this.pageHeight;
    this._hScrollBar.maximum = this.maxScrollX;
    this._hScrollBar.page = this.pageWidth;

    // Re-clamp the scroll position.
    this._scrollTo(this._scrollX, this._scrollY);
  }

  /**
   * Sync the viewport to the given scroll position.
   *
   * #### Notes
   * This schedules a full repaint and syncs the scroll state.
   */
  private _syncViewport(): void {
    this.repaintContent();
    this.repaintOverlay();
    this._syncScrollState();
  }

  /**
   * Process a message sent to the viewport
   */
  private _processViewportMessage(msg: Message): void {
    switch (msg.type) {
      case 'resize':
        this._onViewportResize(msg as Widget.ResizeMessage);
        break;
      case 'scroll-request':
        this._onViewportScrollRequest(msg);
        break;
      case 'paint-request':
        this._onViewportPaintRequest(msg as Private.PaintRequest);
        break;
      case 'overlay-paint-request':
        this._onViewportOverlayPaintRequest(msg);
        break;
      case 'row-resize-request':
        this._onViewportRowResizeRequest(msg as Private.RowResizeRequest);
        break;
      case 'column-resize-request':
        this._onViewportColumnResizeRequest(msg as Private.ColumnResizeRequest);
        break;
      default:
        break;
    }
  }

  /**
   * A message hook invoked on a viewport `'resize'` message.
   */
  private _onViewportResize(msg: Widget.ResizeMessage): void {
    // Bail early if the viewport is not visible.
    if (!this._viewport.isVisible) {
      return;
    }

    // Unpack the message data.
    let { width, height } = msg;

    // Measure the viewport node if the dimensions are unknown.
    if (width === -1) {
      width = this._viewport.node.offsetWidth;
    }
    if (height === -1) {
      height = this._viewport.node.offsetHeight;
    }

    // Round the dimensions to the nearest pixel.
    width = Math.round(width);
    height = Math.round(height);

    // Get the current size of the viewport.
    let oldWidth = this._viewportWidth;
    let oldHeight = this._viewportHeight;

    // Updated internal viewport size.
    this._viewportWidth = width;
    this._viewportHeight = height;

    // Resize the canvas if needed.
    this._resizeCanvasIfNeeded(width, height);

    // Bail early if there is nothing to paint.
    if (width === 0 || height === 0) {
      return;
    }

    // Paint the whole grid if the old size was zero.
    if (oldWidth === 0 || oldHeight === 0) {
      this.paintContent(0, 0, width, height);
      this._paintOverlay();
      return;
    }

    // Paint the right edge as needed.
    if (this._stretchLastColumn && this.pageWidth > this.bodyWidth) {
      let bx = this._columnSections.offsetOf(this._columnSections.count - 1);
      let x = Math.min(this.headerWidth + bx, oldWidth);
      this.paintContent(x, 0, width - x, height);
    } else if (width > oldWidth) {
      this.paintContent(oldWidth, 0, width - oldWidth + 1, height);
    }

    // Paint the bottom edge as needed.
    if (this._stretchLastRow && this.pageHeight > this.bodyHeight) {
      let by = this._rowSections.offsetOf(this._rowSections.count - 1);
      let y = Math.min(this.headerHeight + by, oldHeight);
      this.paintContent(0, y, width, height - y);
    } else if (height > oldHeight) {
      this.paintContent(0, oldHeight, width, height - oldHeight + 1);
    }

    // Paint the overlay.
    this._paintOverlay();
  }

  /**
   * A message hook invoked on a viewport `'scroll-request'` message.
   */
  private _onViewportScrollRequest(msg: Message): void {
    this._scrollTo(this._hScrollBar.value, this._vScrollBar.value);
  }

  /**
   * A message hook invoked on a viewport `'paint-request'` message.
   */
  private _onViewportPaintRequest(msg: Private.PaintRequest): void {
    // Bail early if the viewport is not visible.
    if (!this._viewport.isVisible) {
      return;
    }

    // Bail early if the viewport has zero area.
    if (this._viewportWidth === 0 || this._viewportHeight === 0) {
      return;
    }

    // Set up the paint limits.
    let xMin = 0;
    let yMin = 0;
    let xMax = this._viewportWidth - 1;
    let yMax = this._viewportHeight - 1;

    // Fetch the scroll position.
    let sx = this._scrollX;
    let sy = this._scrollY;

    // Fetch the header dimensions.
    let hw = this.headerWidth;
    let hh = this.headerHeight;

    // Fetch the section lists.
    let rs = this._rowSections;
    let cs = this._columnSections;
    let rhs = this._rowHeaderSections;
    let chs = this._columnHeaderSections;

    // Unpack the message data.
    let { region, r1, c1, r2, c2 } = msg;

    // Set up the paint variables.
    let x1: number;
    let y1: number;
    let x2: number;
    let y2: number;

    // Fill the paint variables based on the paint region.
    switch (region) {
      case 'all':
        x1 = xMin;
        y1 = yMin;
        x2 = xMax;
        y2 = yMax;
        break;
      case 'body':
        r1 = Math.max(0, Math.min(r1, rs.count));
        c1 = Math.max(0, Math.min(c1, cs.count));
        r2 = Math.max(0, Math.min(r2, rs.count));
        c2 = Math.max(0, Math.min(c2, cs.count));
        x1 = cs.offsetOf(c1) - sx + hw;
        y1 = rs.offsetOf(r1) - sy + hh;
        x2 = cs.extentOf(c2) - sx + hw;
        y2 = rs.extentOf(r2) - sy + hh;
        break;
      case 'row-header':
        r1 = Math.max(0, Math.min(r1, rs.count));
        c1 = Math.max(0, Math.min(c1, rhs.count));
        r2 = Math.max(0, Math.min(r2, rs.count));
        c2 = Math.max(0, Math.min(c2, rhs.count));
        x1 = rhs.offsetOf(c1);
        y1 = rs.offsetOf(r1) - sy + hh;
        x2 = rhs.extentOf(c2);
        y2 = rs.extentOf(r2) - sy + hh;
        break;
      case 'column-header':
        r1 = Math.max(0, Math.min(r1, chs.count));
        c1 = Math.max(0, Math.min(c1, cs.count));
        r2 = Math.max(0, Math.min(r2, chs.count));
        c2 = Math.max(0, Math.min(c2, cs.count));
        x1 = cs.offsetOf(c1) - sx + hw;
        y1 = chs.offsetOf(r1);
        x2 = cs.extentOf(c2) - sx + hw;
        y2 = chs.extentOf(r2);
        break;
      case 'corner-header':
        r1 = Math.max(0, Math.min(r1, chs.count));
        c1 = Math.max(0, Math.min(c1, rhs.count));
        r2 = Math.max(0, Math.min(r2, chs.count));
        c2 = Math.max(0, Math.min(c2, rhs.count));
        x1 = rhs.offsetOf(c1);
        y1 = chs.offsetOf(r1);
        x2 = rhs.extentOf(c2);
        y2 = chs.extentOf(r2);
        break;
      default:
        throw 'unreachable';
    }

    // Bail early if the dirty rect is outside the bounds.
    if (x2 < xMin || y2 < yMin || x1 > xMax || y1 > yMax) {
      return;
    }

    // Clamp the dirty rect to the paint bounds.
    x1 = Math.max(xMin, Math.min(x1, xMax));
    y1 = Math.max(yMin, Math.min(y1, yMax));
    x2 = Math.max(xMin, Math.min(x2, xMax));
    y2 = Math.max(yMin, Math.min(y2, yMax));

    // Paint the content of the dirty rect.
    this.paintContent(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
  }

  /**
   * A message hook invoked on a viewport `'overlay-paint-request'` message.
   */
  private _onViewportOverlayPaintRequest(msg: Message): void {
    // Bail early if the viewport is not visible.
    if (!this._viewport.isVisible) {
      return;
    }

    // Bail early if the viewport has zero area.
    if (this._viewportWidth === 0 || this._viewportHeight === 0) {
      return;
    }

    // Paint the content of the overlay.
    this._paintOverlay();
  }

  /**
   * A message hook invoked on a viewport `'row-resize-request'` message.
   */
  private _onViewportRowResizeRequest(msg: Private.RowResizeRequest): void {
    if (msg.region === 'body') {
      this._resizeRow(msg.index, msg.size);
    } else {
      this._resizeColumnHeader(msg.index, msg.size);
    }
  }

  /**
   * A message hook invoked on a viewport `'column-resize-request'` message.
   */
  private _onViewportColumnResizeRequest(
    msg: Private.ColumnResizeRequest
  ): void {
    if (msg.region === 'body') {
      this._resizeColumn(msg.index, msg.size);
    } else {
      this._resizeRowHeader(msg.index, msg.size);
    }
  }

  /**
   * Handle the `thumbMoved` signal from a scroll bar.
   */
  private _onThumbMoved(sender: ScrollBar): void {
    MessageLoop.postMessage(this._viewport, Private.ScrollRequest);
  }

  /**
   * Handle the `pageRequested` signal from a scroll bar.
   */
  private _onPageRequested(
    sender: ScrollBar,
    dir: 'decrement' | 'increment'
  ): void {
    if (sender === this._vScrollBar) {
      this.scrollByPage(dir === 'decrement' ? 'up' : 'down');
    } else {
      this.scrollByPage(dir === 'decrement' ? 'left' : 'right');
    }
  }

  /**
   * Handle the `stepRequested` signal from a scroll bar.
   */
  private _onStepRequested(
    sender: ScrollBar,
    dir: 'decrement' | 'increment'
  ): void {
    if (sender === this._vScrollBar) {
      this.scrollByStep(dir === 'decrement' ? 'up' : 'down');
    } else {
      this.scrollByStep(dir === 'decrement' ? 'left' : 'right');
    }
  }

  /**
   * A signal handler for the data model `changed` signal.
   */
  private _onDataModelChanged(
    sender: DataModel,
    args: DataModel.ChangedArgs
  ): void {
    switch (args.type) {
      case 'rows-inserted':
        this._onRowsInserted(args);
        break;
      case 'columns-inserted':
        this._onColumnsInserted(args);
        break;
      case 'rows-removed':
        this._onRowsRemoved(args);
        break;
      case 'columns-removed':
        this._onColumnsRemoved(args);
        break;
      case 'rows-moved':
        this._onRowsMoved(args);
        break;
      case 'columns-moved':
        this._onColumnsMoved(args);
        break;
      case 'cells-changed':
        this._onCellsChanged(args);
        break;
      case 'model-reset':
        this._onModelReset(args);
        break;
      default:
        throw 'unreachable';
    }
  }

  /**
   * A signal handler for the selection model `changed` signal.
   */
  private _onSelectionsChanged(sender: SelectionModel): void {
    this.repaintOverlay();
  }

  /**
   * Handle rows being inserted in the data model.
   */
  private _onRowsInserted(args: DataModel.RowsChangedArgs): void {
    // Unpack the arg data.
    let { region, index, span } = args;

    // Bail early if there are no sections to insert.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._rowSections;
    } else {
      list = this._columnHeaderSections;
    }

    // Insert the span, maintaining the scroll position as needed.
    if (this._scrollY === this.maxScrollY && this.maxScrollY > 0) {
      list.insert(index, span);
      this._scrollY = this.maxScrollY;
    } else {
      list.insert(index, span);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle columns being inserted into the data model.
   */
  private _onColumnsInserted(args: DataModel.ColumnsChangedArgs): void {
    // Unpack the arg data.
    let { region, index, span } = args;

    // Bail early if there are no sections to insert.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._columnSections;
    } else {
      list = this._rowHeaderSections;
    }

    // Insert the span, maintaining the scroll position as needed.
    if (this._scrollX === this.maxScrollX && this.maxScrollX > 0) {
      list.insert(index, span);
      this._scrollX = this.maxScrollX;
    } else {
      list.insert(index, span);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle rows being removed from the data model.
   */
  private _onRowsRemoved(args: DataModel.RowsChangedArgs): void {
    // Unpack the arg data.
    let { region, index, span } = args;

    // Bail early if there are no sections to remove.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._rowSections;
    } else {
      list = this._columnHeaderSections;
    }

    // Bail if the index or is invalid
    if (index < 0 || index >= list.count) {
      return;
    }

    // Remove the span, maintaining the scroll position as needed.
    if (this._scrollY === this.maxScrollY && this.maxScrollY > 0) {
      list.remove(index, span);
      this._scrollY = this.maxScrollY;
    } else {
      list.remove(index, span);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle columns being removed from the data model.
   */
  private _onColumnsRemoved(args: DataModel.ColumnsChangedArgs): void {
    // Unpack the arg data.
    let { region, index, span } = args;

    // Bail early if there are no sections to remove.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._columnSections;
    } else {
      list = this._rowHeaderSections;
    }

    // Bail if the index or is invalid
    if (index < 0 || index >= list.count) {
      return;
    }

    // Remove the span, maintaining the scroll position as needed.
    if (this._scrollX === this.maxScrollX && this.maxScrollX > 0) {
      list.remove(index, span);
      this._scrollX = this.maxScrollX;
    } else {
      list.remove(index, span);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle rows moving in the data model.
   */
  private _onRowsMoved(args: DataModel.RowsMovedArgs): void {
    // Unpack the arg data.
    let { region, index, span, destination } = args;

    // Bail early if there are no sections to move.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._rowSections;
    } else {
      list = this._columnHeaderSections;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Clamp the move span to the limit.
    span = Math.min(span, list.count - index);

    // Clamp the destination index to the limit.
    destination = Math.min(Math.max(0, destination), list.count - span);

    // Bail early if there is no effective move.
    if (index === destination) {
      return;
    }

    // Compute the first affected index.
    let r1 = Math.min(index, destination);

    // Compute the last affected index.
    let r2 = Math.max(index + span - 1, destination + span - 1);

    // Move the sections in the list.
    list.move(index, span, destination);

    // Schedule a repaint of the dirty cells.
    if (region === 'body') {
      this.repaintRegion('body', r1, 0, r2, Infinity);
      this.repaintRegion('row-header', r1, 0, r2, Infinity);
    } else {
      this.repaintRegion('column-header', r1, 0, r2, Infinity);
      this.repaintRegion('corner-header', r1, 0, r2, Infinity);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle columns moving in the data model.
   */
  private _onColumnsMoved(args: DataModel.ColumnsMovedArgs): void {
    // Unpack the arg data.
    let { region, index, span, destination } = args;

    // Bail early if there are no sections to move.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._columnSections;
    } else {
      list = this._rowHeaderSections;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Clamp the move span to the limit.
    span = Math.min(span, list.count - index);

    // Clamp the destination index to the limit.
    destination = Math.min(Math.max(0, destination), list.count - span);

    // Bail early if there is no effective move.
    if (index === destination) {
      return;
    }

    // Move the sections in the list.
    list.move(index, span, destination);

    // Compute the first affected index.
    let c1 = Math.min(index, destination);

    // Compute the last affected index.
    let c2 = Math.max(index + span - 1, destination + span - 1);

    // Schedule a repaint of the dirty cells.
    if (region === 'body') {
      this.repaintRegion('body', 0, c1, Infinity, c2);
      this.repaintRegion('column-header', 0, c1, Infinity, c2);
    } else {
      this.repaintRegion('row-header', 0, c1, Infinity, c2);
      this.repaintRegion('corner-header', 0, c1, Infinity, c2);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle cells changing in the data model.
   */
  private _onCellsChanged(args: DataModel.CellsChangedArgs): void {
    // Unpack the arg data.
    let { region, row, column, rowSpan, columnSpan } = args;

    // Bail early if there are no cells to modify.
    if (rowSpan <= 0 && columnSpan <= 0) {
      return;
    }

    // Compute the changed cell bounds.
    let r1 = row;
    let c1 = column;
    let r2 = r1 + rowSpan - 1;
    let c2 = c1 + columnSpan - 1;

    // Schedule a repaint of the cell content.
    this.repaintRegion(region, r1, c1, r2, c2);
  }

  /**
   * Handle a full data model reset.
   */
  private _onModelReset(args: DataModel.ModelResetArgs): void {
    // Look up the various current section counts.
    let nr = this._rowSections.count;
    let nc = this._columnSections.count;
    let nrh = this._rowHeaderSections.count;
    let nch = this._columnHeaderSections.count;

    // Compute the delta count for each region.
    let dr = this._dataModel!.rowCount('body') - nr;
    let dc = this._dataModel!.columnCount('body') - nc;
    let drh = this._dataModel!.columnCount('row-header') - nrh;
    let dch = this._dataModel!.rowCount('column-header') - nch;

    // Update the row sections, if needed.
    if (dr > 0) {
      this._rowSections.insert(nr, dr);
    } else if (dr < 0) {
      this._rowSections.remove(nr + dr, -dr);
    }

    // Update the column sections, if needed.
    if (dc > 0) {
      this._columnSections.insert(nc, dc);
    } else if (dc < 0) {
      this._columnSections.remove(nc + dc, -dc);
    }

    // Update the row header sections, if needed.
    if (drh > 0) {
      this._rowHeaderSections.insert(nrh, drh);
    } else if (drh < 0) {
      this._rowHeaderSections.remove(nrh + drh, -drh);
    }

    // Update the column header sections, if needed.
    if (dch > 0) {
      this._columnHeaderSections.insert(nch, dch);
    } else if (dch < 0) {
      this._columnHeaderSections.remove(nch + dch, -dch);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * A signal handler for the renderer map `changed` signal.
   */
  private _onRenderersChanged(): void {
    this.repaintContent();
  }

  /**
   * Handle the `'keydown'` event for the data grid.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    if (this._mousedown) {
      event.preventDefault();
      event.stopPropagation();
    } else if (this._keyHandler) {
      this._keyHandler.onKeyDown(this, event);
    }
  }

  /**
   * Handle the `'mousedown'` event for the data grid.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Ignore everything except the left mouse button.
    if (event.button !== 0) {
      return;
    }

    // Activate the grid.
    this.activate();

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Add the extra document listeners.
    document.addEventListener('keydown', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('mousedown', this, true);
    document.addEventListener('mousemove', this, true);
    document.addEventListener('contextmenu', this, true);

    // Flip the mousedown flag.
    this._mousedown = true;

    // Dispatch to the mouse handler.
    if (this._mouseHandler) {
      this._mouseHandler.onMouseDown(this, event);
    }
  }

  /**
   * Handle the `'mousemove'` event for the data grid.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Stop the event propagation if the mouse is down.
    if (this._mousedown) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Bail if there is no mouse handler.
    if (!this._mouseHandler) {
      return;
    }

    // Dispatch to the mouse handler.
    if (this._mousedown) {
      this._mouseHandler.onMouseMove(this, event);
    } else {
      this._mouseHandler.onMouseHover(this, event);
    }
  }

  /**
   * Handle the `'mouseup'` event for the data grid.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Ignore everything except the left mouse button.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Dispatch to the mouse handler.
    if (this._mouseHandler) {
      this._mouseHandler.onMouseUp(this, event);
    }

    // Release the mouse.
    this._releaseMouse();
  }

  /**
   * Handle the `'dblclick'` event for the data grid.
   */
  private _evtMouseDoubleClick(event: MouseEvent): void {
    // Ignore everything except the left mouse button.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Dispatch to the mouse handler.
    if (this._mouseHandler) {
      this._mouseHandler.onMouseDoubleClick(this, event);
    }

    // Release the mouse.
    this._releaseMouse();
  }

  /**
   * Handle the `'mouseleave'` event for the data grid.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    if (this._mousedown) {
      event.preventDefault();
      event.stopPropagation();
    } else if (this._mouseHandler) {
      this._mouseHandler.onMouseLeave(this, event);
    }
  }

  /**
   * Handle the `'contextmenu'` event for the data grid.
   */
  private _evtContextMenu(event: MouseEvent): void {
    if (this._mousedown) {
      event.preventDefault();
      event.stopPropagation();
    } else if (this._mouseHandler) {
      this._mouseHandler.onContextMenu(this, event);
    }
  }

  /**
   * Handle the `'wheel'` event for the data grid.
   */
  private _evtWheel(event: WheelEvent): void {
    // Ignore the event if `accel` is held.
    if (Platform.accelKey(event)) {
      return;
    }

    // Bail early if there is no mouse handler.
    if (!this._mouseHandler) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Dispatch to the mouse handler.
    this._mouseHandler.onWheel(this, event);
  }

  /**
   * Release the mouse grab.
   */
  private _releaseMouse(): void {
    // Clear the mousedown flag.
    this._mousedown = false;

    // Relase the mouse handler.
    if (this._mouseHandler) {
      this._mouseHandler.release();
    }

    // Remove the document listeners.
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousedown', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  /**
   * Refresh the dpi ratio.
   */
  private _refreshDPI(): void {
    // Get the best integral value for the dpi ratio.
    let dpiRatio = Math.ceil(window.devicePixelRatio);

    // Bail early if the computed dpi ratio has not changed.
    if (this._dpiRatio === dpiRatio) {
      return;
    }

    // Update the internal dpi ratio.
    this._dpiRatio = dpiRatio;

    // Schedule a repaint of the content.
    this.repaintContent();

    // Schedule a repaint of the overlay.
    this.repaintOverlay();

    // Update the canvas size for the new dpi ratio.
    this._resizeCanvasIfNeeded(this._viewportWidth, this._viewportHeight);

    // Ensure the canvas style is scaled for the new ratio.
    this._canvas.style.width = `${this._canvas.width / this._dpiRatio}px`;
    this._canvas.style.height = `${this._canvas.height / this._dpiRatio}px`;

    // Ensure the overlay style is scaled for the new ratio.
    this._overlay.style.width = `${this._overlay.width / this._dpiRatio}px`;
    this._overlay.style.height = `${this._overlay.height / this._dpiRatio}px`;
  }

  /**
   * Resize a row section immediately.
   */
  private _resizeRow(index: number, size: number): void {
    // Look up the target section list.
    let list = this._rowSections;

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Look up the old size of the section.
    let oldSize = list.sizeOf(index);

    // Normalize the new size of the section.
    let newSize = list.clampSize(size);

    // Bail early if the size does not change.
    if (oldSize === newSize) {
      return;
    }

    // Resize the section in the list.
    list.resize(index, newSize);

    // Get the current size of the viewport.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState();
      return;
    }

    // Render entire grid if scrolling merged cells grid
    const paintEverything = Private.shouldPaintEverything(this._dataModel!);

    if (paintEverything) {
      this.paintContent(0, 0, vw, vh);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Look up the column header height.
    let hh = this.headerHeight;

    // Compute the viewport offset of the section.
    let offset = list.offsetOf(index) + hh - this._scrollY;

    // Bail early if there is nothing to paint.
    if (hh >= vh || offset >= vh) {
      this._syncScrollState();
      return;
    }

    // Update the scroll position if the section is not visible.
    if (offset + oldSize <= hh) {
      this._scrollY += delta;
      this._syncScrollState();
      return;
    }

    // Compute the paint origin of the section.
    let pos = Math.max(hh, offset);

    // Paint from the section onward if it spans the viewport.
    if (offset + oldSize >= vh || offset + newSize >= vh) {
      this.paintContent(0, pos, vw, vh - pos);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the X blit dimensions.
    let sx = 0;
    let sw = vw;
    let dx = 0;

    // Compute the Y blit dimensions.
    let sy: number;
    let sh: number;
    let dy: number;
    if (offset + newSize <= hh) {
      sy = hh - delta;
      sh = vh - sy;
      dy = hh;
    } else {
      sy = offset + oldSize;
      sh = vh - sy;
      dy = sy + delta;
    }

    // Blit the valid content to the destination.
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

    // Repaint the section if needed.
    if (newSize > 0 && offset + newSize > hh) {
      this.paintContent(0, pos, vw, offset + newSize - pos);
    }

    // Paint the trailing space as needed.
    if (this._stretchLastRow && this.pageHeight > this.bodyHeight) {
      let r = this._rowSections.count - 1;
      let y = hh + this._rowSections.offsetOf(r);
      this.paintContent(0, y, vw, vh - y);
    } else if (delta < 0) {
      this.paintContent(0, vh + delta, vw, -delta);
    }

    // Paint the overlay.
    this._paintOverlay();

    // Sync the scroll state.
    this._syncScrollState();
  }

  /**
   * Resize a column section immediately.
   */
  private _resizeColumn(index: number, size: number): void {
    // Look up the target section list.
    let list = this._columnSections;

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Look up the old size of the section.
    let oldSize = list.sizeOf(index);

    // Normalize the new size of the section.
    let newSize = list.clampSize(size);

    // Bail early if the size does not change.
    if (oldSize === newSize) {
      return;
    }

    // Resize the section in the list.
    list.resize(index, newSize);

    // Get the current size of the viewport.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState();
      return;
    }

    // Render entire grid if scrolling merged cells grid
    const paintEverything = Private.shouldPaintEverything(this._dataModel!);

    if (paintEverything) {
      this.paintContent(0, 0, vw, vh);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Look up the row header width.
    let hw = this.headerWidth;

    // Compute the viewport offset of the section.
    let offset = list.offsetOf(index) + hw - this._scrollX;

    // Bail early if there is nothing to paint.
    if (hw >= vw || offset >= vw) {
      this._syncScrollState();
      return;
    }

    // Update the scroll position if the section is not visible.
    if (offset + oldSize <= hw) {
      this._scrollX += delta;
      this._syncScrollState();
      return;
    }

    // Compute the paint origin of the section.
    let pos = Math.max(hw, offset);

    // Paint from the section onward if it spans the viewport.
    if (offset + oldSize >= vw || offset + newSize >= vw) {
      this.paintContent(pos, 0, vw - pos, vh);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the Y blit dimensions.
    let sy = 0;
    let sh = vh;
    let dy = 0;

    // Compute the X blit dimensions.
    let sx: number;
    let sw: number;
    let dx: number;
    if (offset + newSize <= hw) {
      sx = hw - delta;
      sw = vw - sx;
      dx = hw;
    } else {
      sx = offset + oldSize;
      sw = vw - sx;
      dx = sx + delta;
    }

    // Blit the valid content to the destination.
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

    // Repaint the section if needed.
    if (newSize > 0 && offset + newSize > hw) {
      this.paintContent(pos, 0, offset + newSize - pos, vh);
    }

    // Paint the trailing space as needed.
    if (this._stretchLastColumn && this.pageWidth > this.bodyWidth) {
      let c = this._columnSections.count - 1;
      let x = hw + this._columnSections.offsetOf(c);
      this.paintContent(x, 0, vw - x, vh);
    } else if (delta < 0) {
      this.paintContent(vw + delta, 0, -delta, vh);
    }

    // Paint the overlay.
    this._paintOverlay();

    // Sync the scroll state after painting.
    this._syncScrollState();
  }

  /**
   * Resize a row header section immediately.
   */
  private _resizeRowHeader(index: number, size: number): void {
    // Look up the target section list.
    let list = this._rowHeaderSections;

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Look up the old size of the section.
    let oldSize = list.sizeOf(index);

    // Normalize the new size of the section.
    let newSize = list.clampSize(size);

    // Bail early if the size does not change.
    if (oldSize === newSize) {
      return;
    }

    // Resize the section in the list.
    list.resize(index, newSize);

    // Get the current size of the viewport.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState();
      return;
    }

    // Render entire grid if scrolling merged cells grid
    const paintEverything = Private.shouldPaintEverything(this._dataModel!);

    if (paintEverything) {
      this.paintContent(0, 0, vw, vh);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Look up the offset of the section.
    let offset = list.offsetOf(index);

    // Bail early if the section is fully outside the viewport.
    if (offset >= vw) {
      this._syncScrollState();
      return;
    }

    // Paint the entire tail if the section spans the viewport.
    if (offset + oldSize >= vw || offset + newSize >= vw) {
      this.paintContent(offset, 0, vw - offset, vh);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the blit content dimensions.
    let sx = offset + oldSize;
    let sy = 0;
    let sw = vw - sx;
    let sh = vh;
    let dx = sx + delta;
    let dy = 0;

    // Blit the valid content to the destination.
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

    // Repaint the header section if needed.
    if (newSize > 0) {
      this.paintContent(offset, 0, newSize, vh);
    }

    // Paint the trailing space as needed.
    if (this._stretchLastColumn && this.pageWidth > this.bodyWidth) {
      let c = this._columnSections.count - 1;
      let x = this.headerWidth + this._columnSections.offsetOf(c);
      this.paintContent(x, 0, vw - x, vh);
    } else if (delta < 0) {
      this.paintContent(vw + delta, 0, -delta + 1, vh);
    }

    // Paint the overlay.
    this._paintOverlay();

    // Sync the scroll state after painting.
    this._syncScrollState();
  }

  /**
   * Resize a column header section immediately.
   */
  private _resizeColumnHeader(index: number, size: number): void {
    // Look up the target section list.
    let list = this._columnHeaderSections;

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Look up the old size of the section.
    let oldSize = list.sizeOf(index);

    // Normalize the new size of the section.
    let newSize = list.clampSize(size);

    // Bail early if the size does not change.
    if (oldSize === newSize) {
      return;
    }

    // Resize the section in the list.
    list.resize(index, newSize);

    // Get the current size of the viewport.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState();
      return;
    }

    // Render entire grid if scrolling merged cells grid
    const paintEverything = Private.shouldPaintEverything(this._dataModel!);

    if (paintEverything) {
      this.paintContent(0, 0, vw, vh);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Paint the overlay.
    this._paintOverlay();

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Look up the offset of the section.
    let offset = list.offsetOf(index);

    // Bail early if the section is fully outside the viewport.
    if (offset >= vh) {
      this._syncScrollState();
      return;
    }

    // Paint the entire tail if the section spans the viewport.
    if (offset + oldSize >= vh || offset + newSize >= vh) {
      this.paintContent(0, offset, vw, vh - offset);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the blit content dimensions.
    let sx = 0;
    let sy = offset + oldSize;
    let sw = vw;
    let sh = vh - sy;
    let dx = 0;
    let dy = sy + delta;

    // Blit the valid contents to the destination.
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

    // Repaint the header section if needed.
    if (newSize > 0) {
      this.paintContent(0, offset, vw, newSize);
    }

    // Paint the trailing space as needed.
    if (this._stretchLastRow && this.pageHeight > this.bodyHeight) {
      let r = this._rowSections.count - 1;
      let y = this.headerHeight + this._rowSections.offsetOf(r);
      this.paintContent(0, y, vw, vh - y);
    } else if (delta < 0) {
      this.paintContent(0, vh + delta, vw, -delta + 1);
    }

    // Paint the overlay.
    this._paintOverlay();

    // Sync the scroll state after painting.
    this._syncScrollState();
  }

  /**
   * Scroll immediately to the specified offset position.
   */
  private _scrollTo(x: number, y: number): void {
    // Bail if no data model found.
    if (!this.dataModel) {
      return;
    }

    // Floor and clamp the position to the allowable range.
    x = Math.max(0, Math.min(Math.floor(x), this.maxScrollX));
    y = Math.max(0, Math.min(Math.floor(y), this.maxScrollY));

    // Synchronize the scroll bar values.
    this._hScrollBar.value = x;
    this._vScrollBar.value = y;

    // Compute the delta scroll amount.
    let dx = x - this._scrollX;
    let dy = y - this._scrollY;

    // Bail early if there is no effective scroll.
    if (dx === 0 && dy === 0) {
      return;
    }

    // Bail early if the viewport is not visible.
    if (!this._viewport.isVisible) {
      this._scrollX = x;
      this._scrollY = y;
      return;
    }

    // Get the current size of the viewport.
    let width = this._viewportWidth;
    let height = this._viewportHeight;

    // Bail early if the viewport is empty.
    if (width === 0 || height === 0) {
      this._scrollX = x;
      this._scrollY = y;
      return;
    }

    // Get the visible content origin.
    let contentX = this.headerWidth;
    let contentY = this.headerHeight;

    // Get the visible content dimensions.
    let contentWidth = width - contentX;
    let contentHeight = height - contentY;

    // Bail early if there is no content to draw.
    if (contentWidth <= 0 && contentHeight <= 0) {
      this._scrollX = x;
      this._scrollY = y;
      return;
    }

    // Compute the area which needs painting for the `dx` scroll.
    let dxArea = 0;
    if (dx !== 0 && contentWidth > 0) {
      if (Math.abs(dx) >= contentWidth) {
        dxArea = contentWidth * height;
      } else {
        dxArea = Math.abs(dx) * height;
      }
    }

    // Compute the area which needs painting for the `dy` scroll.
    let dyArea = 0;
    if (dy !== 0 && contentHeight > 0) {
      if (Math.abs(dy) >= contentHeight) {
        dyArea = width * contentHeight;
      } else {
        dyArea = width * Math.abs(dy);
      }
    }

    // If the area sum is larger than the total, paint everything.
    if (dxArea + dyArea >= width * height) {
      this._scrollX = x;
      this._scrollY = y;
      this.paintContent(0, 0, width, height);
      this._paintOverlay();
      return;
    }

    // Update the internal Y scroll position.
    this._scrollY = y;

    // Scroll the Y axis if needed. If the scroll distance exceeds
    // the visible height, paint everything. Otherwise, blit the
    // valid content and paint the dirty region.
    if (dy !== 0 && contentHeight > 0) {
      if (Math.abs(dy) >= contentHeight) {
        this.paintContent(0, contentY, width, contentHeight);
      } else {
        const x = 0;
        const y = dy < 0 ? contentY : contentY + dy;
        const w = width;
        const h = contentHeight - Math.abs(dy);
        this._blitContent(this._canvas, x, y, w, h, x, y - dy);
        this.paintContent(
          0,
          dy < 0 ? contentY : height - dy,
          width,
          Math.abs(dy)
        );
      }
    }

    // Update the internal X scroll position.
    this._scrollX = x;

    // Scroll the X axis if needed. If the scroll distance exceeds
    // the visible width, paint everything. Otherwise, blit the
    // valid content and paint the dirty region.
    if (dx !== 0 && contentWidth > 0) {
      if (Math.abs(dx) >= contentWidth) {
        this.paintContent(contentX, 0, contentWidth, height);
      } else {
        const x = dx < 0 ? contentX : contentX + dx;
        const y = 0;
        const w = contentWidth - Math.abs(dx);
        const h = height;
        this._blitContent(this._canvas, x, y, w, h, x - dx, y);
        this.paintContent(
          dx < 0 ? contentX : width - dx,
          0,
          Math.abs(dx),
          height
        );
      }
    }

    // Paint the overlay.
    this._paintOverlay();
  }
  /**
   * Blit content into the on-screen grid canvas.
   *
   * The rect should be expressed in viewport coordinates.
   *
   * This automatically accounts for the dpi ratio.
   */
  private _blitContent(
    source: HTMLCanvasElement,
    x: number,
    y: number,
    w: number,
    h: number,
    dx: number,
    dy: number
  ): void {
    // Scale the blit coordinates by the dpi ratio.
    x *= this._dpiRatio;
    y *= this._dpiRatio;
    w *= this._dpiRatio;
    h *= this._dpiRatio;
    dx *= this._dpiRatio;
    dy *= this._dpiRatio;

    // Save the current gc state.
    this._canvasGC.save();

    // Set the transform to the identity matrix.
    this._canvasGC.setTransform(1, 0, 0, 1, 0, 0);

    // Draw the specified content.
    this._canvasGC.drawImage(source, x, y, w, h, dx, dy, w, h);

    // Restore the gc state.
    this._canvasGC.restore();
  }

  /**
   * Paint the grid content for the given dirty rect.
   *
   * The rect should be expressed in valid viewport coordinates.
   *
   * This is the primary paint entry point. The individual `_draw*`
   * methods should not be invoked directly. This method dispatches
   * to the drawing methods in the correct order.
   */
  protected paintContent(rx: number, ry: number, rw: number, rh: number): void {
    // Scale the canvas and buffer GC for the dpi ratio.
    this._canvasGC.setTransform(this._dpiRatio, 0, 0, this._dpiRatio, 0, 0);
    this._bufferGC.setTransform(this._dpiRatio, 0, 0, this._dpiRatio, 0, 0);

    // Clear the dirty rect of all content.
    this._canvasGC.clearRect(rx, ry, rw, rh);

    // Draw the void region.
    this._drawVoidRegion(rx, ry, rw, rh);

    // Draw the body region.
    this._drawBodyRegion(rx, ry, rw, rh);

    // Draw the row header region.
    this._drawRowHeaderRegion(rx, ry, rw, rh);

    // Draw the column header region.
    this._drawColumnHeaderRegion(rx, ry, rw, rh);

    // Draw the corner header region.
    this.drawCornerHeaderRegion(rx, ry, rw, rh);
  }

  /**
   * Resizes body column headers so their text fits
   * without clipping or wrapping.
   * @param dataModel
   */
  private _fitBodyColumnHeaders(
    dataModel: DataModel,
    padding: number,
    numCols?: number
  ): void {
    // Get the body column count
    const bodyColumnCount =
      numCols === undefined ? dataModel.columnCount('body') : numCols;

    for (let i = 0; i < bodyColumnCount; i++) {
      /*
        if we're working with nested column headers,
        retrieve the nested levels and iterate on them.
      */
      const numRows = dataModel.rowCount('column-header');

      /*
        Calculate the maximum text width vertically, across
        all nested rows under a given column number.
      */
      let maxWidth = 0;
      for (let j = 0; j < numRows; j++) {
        const cellValue = dataModel.data('column-header', j, i);

        // Basic CellConfig object to get the renderer for that cell
        let config = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          region: 'column-header' as DataModel.CellRegion,
          row: 0,
          column: i,
          value: null as any,
          metadata: DataModel.emptyMetadata
        };

        // Get the renderer for the given cell
        const renderer = this.cellRenderers.get(config) as TextRenderer;

        // Use the canvas context to measure the cell's text width
        const gc = this.canvasGC;
        gc.font = CellRenderer.resolveOption(renderer.font, config);
        const textWidth = gc.measureText(cellValue).width;

        // Update the maximum width for that column.
        maxWidth = Math.max(maxWidth, textWidth);
      }

      /*
        Send a resize message with new width for the given column.
        Using a padding of 15 pixels to leave some room.
      */
      this.resizeColumn('body', i, maxWidth + padding);
    }
  }

  /**
   * Resizes row header columns so their text fits
   * without clipping or wrapping.
   * @param dataModel
   */
  private _fitRowColumnHeaders(
    dataModel: DataModel,
    padding: number,
    numCols?: number
  ): void {
    /*
      if we're working with nested row headers,
      retrieve the nested levels and iterate on them.
    */
    const rowColumnCount =
      numCols === undefined ? dataModel.columnCount('row-header') : numCols;

    for (let i = 0; i < rowColumnCount; i++) {
      const numCols = dataModel.rowCount('column-header');
      /*
        Calculate the maximum text width vertically, across
        all nested columns under a given row index.
      */
      let maxWidth = 0;
      for (let j = 0; j < numCols; j++) {
        const cellValue = dataModel.data('corner-header', j, i);

        // Basic CellConfig object to get the renderer for that cell.
        let config = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          region: 'column-header' as DataModel.CellRegion,
          row: 0,
          column: i,
          value: null as any,
          metadata: DataModel.emptyMetadata
        };

        // Get the renderer for the given cell.
        const renderer = this.cellRenderers.get(config) as TextRenderer;

        // Use the canvas context to measure the cell's text width
        const gc = this.canvasGC;
        gc.font = CellRenderer.resolveOption(renderer.font, config);
        const textWidth = gc.measureText(cellValue).width;
        maxWidth = Math.max(maxWidth, textWidth);
      }

      /*
        Send a resize message with new width for the given column.
        Using a padding of 15 pixels to leave some room.
      */
      this.resizeColumn('row-header', i, maxWidth + padding);
    }
  }

  /**
   * Paint the overlay content for the entire grid.
   *
   * This is the primary overlay paint entry point. The individual
   * `_draw*` methods should not be invoked directly. This method
   * dispatches to the drawing methods in the correct order.
   */
  private _paintOverlay(): void {
    // Scale the overlay GC for the dpi ratio.
    this._overlayGC.setTransform(this._dpiRatio, 0, 0, this._dpiRatio, 0, 0);

    // Clear the overlay of all content.
    this._overlayGC.clearRect(0, 0, this._overlay.width, this._overlay.height);

    // Draw the body selections.
    this._drawBodySelections();

    // Draw the row header selections.
    this._drawRowHeaderSelections();

    // Draw the column header selections.
    this._drawColumnHeaderSelections();

    // Draw the cursor.
    this._drawCursor();

    // Draw the shadows.
    this._drawShadows();
  }

  /**
   * Draw the void region for the dirty rect.
   */
  private _drawVoidRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    // Look up the void color.
    let color = this._style.voidColor;

    // Bail if there is no void color.
    if (!color) {
      return;
    }

    // Fill the dirty rect with the void color.
    this._canvasGC.fillStyle = color;
    this._canvasGC.fillRect(rx, ry, rw, rh);
  }

  /**
   * Draw the body region which intersects the dirty rect.
   */
  private _drawBodyRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    // Get the visible content dimensions.
    let contentW = this._columnSections.length - this._scrollX;
    let contentH = this._rowSections.length - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this.headerWidth;
    let contentY = this.headerHeight;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw <= contentX) {
      return;
    }
    if (ry + rh <= contentY) {
      return;
    }
    if (rx >= contentX + contentW) {
      return;
    }
    if (ry >= contentY + contentH) {
      return;
    }

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let bw = this.bodyWidth;
    let ph = this.pageHeight;
    let pw = this.pageWidth;

    // Get the upper and lower bounds of the dirty content area.
    let x1 = Math.max(rx, contentX);
    let y1 = Math.max(ry, contentY);
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1);
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1);

    // Convert the dirty content bounds into cell bounds.
    let r1 = this._rowSections.indexOf(y1 - contentY + this._scrollY);
    let c1 = this._columnSections.indexOf(x1 - contentX + this._scrollX);
    let r2 = this._rowSections.indexOf(y2 - contentY + this._scrollY);
    let c2 = this._columnSections.indexOf(x2 - contentX + this._scrollX);

    // Fetch the max row and column.
    let maxRow = this._rowSections.count - 1;
    let maxColumn = this._columnSections.count - 1;

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = maxRow;
    }
    if (c2 < 0) {
      c2 = maxColumn;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._columnSections.offsetOf(c1) + contentX - this._scrollX;
    let y = this._rowSections.offsetOf(r1) + contentY - this._scrollY;

    // Set up the paint region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._rowSections.sizeOf(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._columnSections.sizeOf(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Adjust the geometry if the last row is streched.
    if (this._stretchLastRow && ph > bh && r2 === maxRow) {
      let dh = this.pageHeight - this.bodyHeight;
      rowSizes[rowSizes.length - 1] += dh;
      height += dh;
      y2 += dh;
    }

    // Adjust the geometry if the last column is streched.
    if (this._stretchLastColumn && pw > bw && c2 === maxColumn) {
      let dw = this.pageWidth - this.bodyWidth;
      columnSizes[columnSizes.length - 1] += dw;
      width += dw;
      x2 += dw;
    }

    // Create the paint region object.
    let rgn: Private.PaintRegion = {
      region: 'body',
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
      columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.backgroundColor);

    // Draw the row background.
    this._drawRowBackground(rgn, this._style.rowBackgroundColor);

    // Draw the column background.
    this._drawColumnBackground(rgn, this._style.columnBackgroundColor);

    // Draw the cell content for the paint region.
    this._drawCells(rgn);

    // Draw the horizontal grid lines.
    this._drawHorizontalGridLines(
      rgn,
      this._style.horizontalGridLineColor || this._style.gridLineColor
    );

    // Draw the vertical grid lines.
    this._drawVerticalGridLines(
      rgn,
      this._style.verticalGridLineColor || this._style.gridLineColor
    );
  }

  /**
   * Draw the row header region which intersects the dirty rect.
   */
  private _drawRowHeaderRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    // Get the visible content dimensions.
    let contentW = this.headerWidth;
    let contentH = this.bodyHeight - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = 0;
    let contentY = this.headerHeight;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw <= contentX) {
      return;
    }
    if (ry + rh <= contentY) {
      return;
    }
    if (rx >= contentX + contentW) {
      return;
    }
    if (ry >= contentY + contentH) {
      return;
    }

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let ph = this.pageHeight;

    // Get the upper and lower bounds of the dirty content area.
    let x1 = rx;
    let y1 = Math.max(ry, contentY);
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1);
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1);

    // Convert the dirty content bounds into cell bounds.
    let r1 = this._rowSections.indexOf(y1 - contentY + this._scrollY);
    let c1 = this._rowHeaderSections.indexOf(x1);
    let r2 = this._rowSections.indexOf(y2 - contentY + this._scrollY);
    let c2 = this._rowHeaderSections.indexOf(x2);

    // Fetch max row and column.
    let maxRow = this._rowSections.count - 1;
    let maxColumn = this._rowHeaderSections.count - 1;

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = maxRow;
    }
    if (c2 < 0) {
      c2 = maxColumn;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._rowHeaderSections.offsetOf(c1);
    let y = this._rowSections.offsetOf(r1) + contentY - this._scrollY;

    // Set up the paint region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._rowSections.sizeOf(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._rowHeaderSections.sizeOf(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Adjust the geometry if the last row is stretched.
    if (this._stretchLastRow && ph > bh && r2 === maxRow) {
      let dh = this.pageHeight - this.bodyHeight;
      rowSizes[rowSizes.length - 1] += dh;
      height += dh;
      y2 += dh;
    }

    // Create the paint region object.
    let rgn: Private.PaintRegion = {
      region: 'row-header',
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
      columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.headerBackgroundColor);

    // Draw the cell content for the paint region.
    this._drawCells(rgn);

    // Draw the horizontal grid lines.
    this._drawHorizontalGridLines(
      rgn,
      this._style.headerHorizontalGridLineColor ||
        this._style.headerGridLineColor
    );

    // Draw the vertical grid lines.
    this._drawVerticalGridLines(
      rgn,
      this._style.headerVerticalGridLineColor || this._style.headerGridLineColor
    );
  }

  /**
   * Draw the column header region which intersects the dirty rect.
   */
  private _drawColumnHeaderRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    // Get the visible content dimensions.
    let contentW = this.bodyWidth - this._scrollX;
    let contentH = this.headerHeight;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this.headerWidth;
    let contentY = 0;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw <= contentX) {
      return;
    }
    if (ry + rh <= contentY) {
      return;
    }
    if (rx >= contentX + contentW) {
      return;
    }
    if (ry >= contentY + contentH) {
      return;
    }

    // Fetch the geometry.
    let bw = this.bodyWidth;
    let pw = this.pageWidth;

    // Get the upper and lower bounds of the dirty content area.
    let x1 = Math.max(rx, contentX);
    let y1 = ry;
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1);
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1);

    // Convert the dirty content bounds into cell bounds.
    let r1 = this._columnHeaderSections.indexOf(y1);
    let c1 = this._columnSections.indexOf(x1 - contentX + this._scrollX);
    let r2 = this._columnHeaderSections.indexOf(y2);
    let c2 = this._columnSections.indexOf(x2 - contentX + this._scrollX);

    // Fetch the max row and column.
    let maxRow = this._columnHeaderSections.count - 1;
    let maxColumn = this._columnSections.count - 1;

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = maxRow;
    }
    if (c2 < 0) {
      c2 = maxColumn;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._columnSections.offsetOf(c1) + contentX - this._scrollX;
    let y = this._columnHeaderSections.offsetOf(r1);

    // Set up the paint region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._columnHeaderSections.sizeOf(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._columnSections.sizeOf(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Adjust the geometry if the last column is stretched.
    if (this._stretchLastColumn && pw > bw && c2 === maxColumn) {
      let dw = this.pageWidth - this.bodyWidth;
      columnSizes[columnSizes.length - 1] += dw;
      width += dw;
      x2 += dw;
    }

    // Create the paint region object.
    let rgn: Private.PaintRegion = {
      region: 'column-header',
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
      columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.headerBackgroundColor);

    // Draw the cell content for the paint region.
    this._drawCells(rgn);

    // Draw the horizontal grid lines.
    this._drawHorizontalGridLines(
      rgn,
      this._style.headerHorizontalGridLineColor ||
        this._style.headerGridLineColor
    );

    // Draw the vertical grid lines.
    this._drawVerticalGridLines(
      rgn,
      this._style.headerVerticalGridLineColor || this._style.headerGridLineColor
    );
  }

  /**
   * Draw the corner header region which intersects the dirty rect.
   */
  protected drawCornerHeaderRegion(
    rx: number,
    ry: number,
    rw: number,
    rh: number
  ): void {
    // Get the visible content dimensions.
    let contentW = this.headerWidth;
    let contentH = this.headerHeight;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = 0;
    let contentY = 0;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw <= contentX) {
      return;
    }
    if (ry + rh <= contentY) {
      return;
    }
    if (rx >= contentX + contentW) {
      return;
    }
    if (ry >= contentY + contentH) {
      return;
    }

    // Get the upper and lower bounds of the dirty content area.
    let x1 = rx;
    let y1 = ry;
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1);
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1);

    // Convert the dirty content bounds into cell bounds.
    let r1 = this._columnHeaderSections.indexOf(y1);
    let c1 = this._rowHeaderSections.indexOf(x1);
    let r2 = this._columnHeaderSections.indexOf(y2);
    let c2 = this._rowHeaderSections.indexOf(x2);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._columnHeaderSections.count - 1;
    }
    if (c2 < 0) {
      c2 = this._rowHeaderSections.count - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._rowHeaderSections.offsetOf(c1);
    let y = this._columnHeaderSections.offsetOf(r1);

    // Set up the paint region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._columnHeaderSections.sizeOf(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._rowHeaderSections.sizeOf(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Create the paint region object.
    let rgn: Private.PaintRegion = {
      region: 'corner-header',
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
      columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.headerBackgroundColor);

    // Draw the cell content for the paint region.
    this._drawCells(rgn);

    // Draw the horizontal grid lines.
    this._drawHorizontalGridLines(
      rgn,
      this._style.headerHorizontalGridLineColor ||
        this._style.headerGridLineColor
    );

    // Draw the vertical grid lines.
    this._drawVerticalGridLines(
      rgn,
      this._style.headerVerticalGridLineColor || this._style.headerGridLineColor
    );
  }

  /**
   * Draw the background for the given paint region.
   */
  private _drawBackground(
    rgn: Private.PaintRegion,
    color: string | undefined
  ): void {
    // Bail if there is no color to draw.
    if (!color) {
      return;
    }

    // Unpack the region.
    let { xMin, yMin, xMax, yMax } = rgn;

    // Fill the region with the specified color.
    this._canvasGC.fillStyle = color;
    this._canvasGC.fillRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1);
  }

  /**
   * Draw the row background for the given paint region.
   */
  private _drawRowBackground(
    rgn: Private.PaintRegion,
    colorFn: ((i: number) => string) | undefined
  ): void {
    // Bail if there is no color function.
    if (!colorFn) {
      return;
    }

    // Compute the X bounds for the row.
    let x1 = Math.max(rgn.xMin, rgn.x);
    let x2 = Math.min(rgn.x + rgn.width - 1, rgn.xMax);

    // Draw the background for the rows in the region.
    for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
      // Fetch the size of the row.
      let size = rgn.rowSizes[j];

      // Skip zero sized rows.
      if (size === 0) {
        continue;
      }

      // Get the background color for the row.
      let color = colorFn(rgn.row + j);

      // Fill the row with the background color if needed.
      if (color) {
        let y1 = Math.max(rgn.yMin, y);
        let y2 = Math.min(y + size - 1, rgn.yMax);
        this._canvasGC.fillStyle = color;
        this._canvasGC.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
      }

      // Increment the running Y coordinate.
      y += size;
    }
  }

  /**
   * Draw the column background for the given paint region.
   */
  private _drawColumnBackground(
    rgn: Private.PaintRegion,
    colorFn: ((i: number) => string) | undefined
  ): void {
    // Bail if there is no color function.
    if (!colorFn) {
      return;
    }

    // Compute the Y bounds for the column.
    let y1 = Math.max(rgn.yMin, rgn.y);
    let y2 = Math.min(rgn.y + rgn.height - 1, rgn.yMax);

    // Draw the background for the columns in the region.
    for (let x = rgn.x, i = 0, n = rgn.columnSizes.length; i < n; ++i) {
      // Fetch the size of the column.
      let size = rgn.columnSizes[i];

      // Skip zero sized columns.
      if (size === 0) {
        continue;
      }

      // Get the background color for the column.
      let color = colorFn(rgn.column + i);

      // Fill the column with the background color if needed.
      if (color) {
        let x1 = Math.max(rgn.xMin, x);
        let x2 = Math.min(x + size - 1, rgn.xMax);
        this._canvasGC.fillStyle = color;
        this._canvasGC.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
      }

      // Increment the running X coordinate.
      x += size;
    }
  }

  /**
   * Returns column size
   * @param region
   * @param index
   */
  private _getColumnSize(region: DataModel.CellRegion, index: number): number {
    if (region === 'corner-header') {
      return this._rowHeaderSections.sizeOf(index);
    }
    return this.columnSize(region as DataModel.ColumnRegion, index);
  }

  /**
   * Returns row size
   * @param region
   * @param index
   */
  private _getRowSize(region: DataModel.CellRegion, index: number): number {
    if (region === 'corner-header') {
      return this._columnHeaderSections.sizeOf(index);
    }
    return this.rowSize(region as DataModel.RowRegion, index);
  }

  /**
   * Draw the cells for the given paint region.
   */
  private _drawCells(rgn: Private.PaintRegion): void {
    // Bail if there is no data model.
    if (!this._dataModel) {
      return;
    }

    // Determine if the cell intersects with a merged group at row or column
    let intersectingColumnGroups = CellGroup.getCellGroupsAtColumn(
      this._dataModel!,
      rgn.region,
      rgn.column
    );
    let intersectingRowGroups = CellGroup.getCellGroupsAtRow(
      this._dataModel!,
      rgn.region,
      rgn.row
    );

    // move the bounds of the region if edges of the region are part of a merge group.
    // after the move, new region contains entirety of the merge groups
    rgn = JSONExt.deepCopy(rgn);

    const joinedGroup = CellGroup.joinCellGroupWithMergedCellGroups(
      this.dataModel!,
      {
        r1: rgn.row,
        r2: rgn.row + rgn.rowSizes.length - 1,
        c1: rgn.column,
        c2: rgn.column + rgn.columnSizes.length - 1
      },
      rgn.region
    );

    for (let r = joinedGroup.r1; r < rgn.row; r++) {
      const h = this._getRowSize(rgn.region, r);
      rgn.y -= h;
      rgn.rowSizes = [h].concat(rgn.rowSizes);
    }
    rgn.row = joinedGroup.r1;

    for (let c = joinedGroup.c1; c < rgn.column; c++) {
      const w = this._getColumnSize(rgn.region, c);
      rgn.x -= w;
      rgn.columnSizes = [w].concat(rgn.columnSizes);
    }
    rgn.column = joinedGroup.c1;

    // Set up the cell config object for rendering.
    let config = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      region: rgn.region,
      row: 0,
      column: 0,
      value: null as any,
      metadata: DataModel.emptyMetadata
    };

    let groupIndex = -1;

    // Save the buffer gc before wrapping.
    this._bufferGC.save();

    // Wrap the buffer gc for painting the cells.
    let gc = new GraphicsContext(this._bufferGC);

    let height = 0;

    // Loop over the columns in the region.
    for (let x = rgn.x, i = 0, n = rgn.columnSizes.length; i < n; ++i) {
      let xOffset = 0;
      let yOffset = 0;

      // Fetch the size of the column.
      let width = rgn.columnSizes[i];

      // Skip zero sized columns.
      if (width === 0) {
        continue;
      }

      xOffset = width;

      // Compute the column index.
      let column = rgn.column + i;

      // Update the config for the current column.
      config.x = x;
      config.width = width;
      config.column = column;

      // Loop over the rows in the column.
      for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
        // Fetch the size of the row.
        height = rgn.rowSizes[j];

        // Skip zero sized rows.
        if (height === 0) {
          continue;
        }

        // Compute the row index.
        let row = rgn.row + j;

        groupIndex = CellGroup.getGroupIndex(
          this.dataModel!,
          config.region,
          row,
          column
        );
        yOffset = height;

        /**
         * For merged cell regions, only rendering the merged region
         * if the "parent" cell is the one being painted. Bail otherwise.
         */
        if (groupIndex !== -1) {
          const group = this.dataModel!.group(config.region, groupIndex)!;
          if (group.r1 === row && group.c1 === column) {
            width = 0;
            for (let c = group.c1; c <= group.c2; c++) {
              width += this._getColumnSize(config.region, c);
            }

            height = 0;
            for (let r = group.r1; r <= group.r2; r++) {
              height += this._getRowSize(config.region, r);
            }
          } else {
            y += yOffset;
            continue;
          }
        } else {
          /**
           * Reset column width if we're rendering a column-header
           * which is not part of a merged cell group.
           */
          if (rgn.region == 'column-header') {
            width = rgn.columnSizes[i];
          }
        }

        // Clear the buffer rect for the cell.
        gc.clearRect(x, y, width, height);

        // Save the GC state.
        gc.save();

        // Get the value for the cell.
        let value: any;
        try {
          value = this._dataModel.data(rgn.region, row, column);
        } catch (err) {
          value = undefined;
          console.error(err);
        }

        // Get the metadata for the cell.
        let metadata: DataModel.Metadata;
        try {
          metadata = this._dataModel.metadata(rgn.region, row, column);
        } catch (err) {
          metadata = DataModel.emptyMetadata;
          console.error(err);
        }

        // Update the config for the current cell.
        config.y = y;
        config.height = height;
        config.width = width;
        config.row = row;
        config.value = value;
        config.metadata = metadata;

        // Get the renderer for the cell.
        let renderer = this._cellRenderers.get(config);

        // Save the GC state.
        gc.save();

        // Paint the cell into the off-screen buffer.
        try {
          renderer.paint(gc, config);
        } catch (err) {
          console.error(err);
        }

        // Restore the GC state.
        gc.restore();

        // Compute the actual X bounds for the cell.
        let x1 = Math.max(rgn.xMin, config.x);
        let x2 = Math.min(config.x + config.width - 1, rgn.xMax);

        // Compute the actual Y bounds for the cell.
        let y1 = Math.max(rgn.yMin, config.y);
        let y2 = Math.min(config.y + config.height - 1, rgn.yMax);

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
            );
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
          );
        }

        // Increment the running Y coordinate.
        y += yOffset;
      }

      // Restore the GC state.
      gc.restore();

      // Increment the running X coordinate.
      x += xOffset;
    }

    // Dispose of the wrapped gc.
    gc.dispose();

    // Restore the final buffer gc state.
    this._bufferGC.restore();
  }

  /**
   * Draw the horizontal grid lines for the given paint region.
   */
  private _drawHorizontalGridLines(
    rgn: Private.PaintRegion,
    color: string | undefined
  ): void {
    // Bail if there is no color to draw.
    if (!color) {
      return;
    }

    // Compute the X bounds for the horizontal lines.
    let x1 = Math.max(rgn.xMin, rgn.x);

    // Begin the path for the grid lines.
    this._canvasGC.beginPath();

    // Set the line width for the grid lines.
    this._canvasGC.lineWidth = 1;

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let ph = this.pageHeight;

    // Fetch the number of grid lines to be drawn.
    let n = rgn.rowSizes.length;

    // Adjust the count down if the last line shouldn't be drawn.
    if (this._stretchLastRow && ph > bh) {
      if (rgn.row + n === this._rowSections.count) {
        n -= 1;
      }
    }

    // Draw the horizontal grid lines.
    for (let y = rgn.y, j = 0; j < n; ++j) {
      // Fetch the size of the row.
      let size = rgn.rowSizes[j];

      // Skip zero sized rows.
      if (size === 0) {
        continue;
      }

      let xStart = 0;
      let lineStarted = false;
      let lines = [];
      let leftCurrent = x1;

      for (let c = rgn.column; c < rgn.column + rgn.columnSizes.length; c++) {
        const cIndex = c - rgn.column;
        const cellUp = [rgn.row + j, c];
        const cellDown = [rgn.row + j + 1, c];

        if (
          CellGroup.areCellsMerged(
            this.dataModel!,
            rgn.region,
            cellUp,
            cellDown
          )
        ) {
          if (lineStarted) {
            lines.push([xStart, leftCurrent]);
          }
          lineStarted = false;
        } else {
          if (!lineStarted) {
            lineStarted = true;
            xStart = leftCurrent;
          }
        }

        leftCurrent += rgn.columnSizes[cIndex];
        if (c === rgn.column) {
          leftCurrent -= rgn.xMin - rgn.x;
        }
      }

      if (lineStarted) {
        lines.push([xStart, rgn.xMax + 1]);
      }

      // Compute the Y position of the line.
      let pos = y + size - 1;

      // Draw the line if it's in range of the dirty rect.
      if (pos >= rgn.yMin && pos <= rgn.yMax) {
        // Render entire grid if scrolling merged cells grid
        const extendLines = Private.shouldPaintEverything(this._dataModel!);
        if (extendLines) {
          for (const line of lines) {
            const [x1, x2] = line;
            this._canvasGC.moveTo(x1, pos + 0.5);
            this._canvasGC.lineTo(x2, pos + 0.5);
          }
        } else {
          const x2 = Math.min(rgn.x + rgn.width, rgn.xMax + 1);
          this._canvasGC.moveTo(x1, pos + 0.5);
          this._canvasGC.lineTo(x2, pos + 0.5);
        }
      }

      // Increment the running Y coordinate.
      y += size;
    }

    // Stroke the lines with the specified color.
    this._canvasGC.strokeStyle = color;
    this._canvasGC.stroke();
  }

  /**
   * Draw the vertical grid lines for the given paint region.
   */
  private _drawVerticalGridLines(
    rgn: Private.PaintRegion,
    color: string | undefined
  ): void {
    // Bail if there is no color to draw.
    if (!color) {
      return;
    }

    // Compute the Y bounds for the vertical lines.
    let y1 = Math.max(rgn.yMin, rgn.y);

    // Begin the path for the grid lines
    this._canvasGC.beginPath();

    // Set the line width for the grid lines.
    this._canvasGC.lineWidth = 1;

    // Fetch the geometry.
    let bw = this.bodyWidth;
    let pw = this.pageWidth;

    // Fetch the number of grid lines to be drawn.
    let n = rgn.columnSizes.length;

    // Adjust the count down if the last line shouldn't be drawn.
    if (this._stretchLastColumn && pw > bw) {
      if (rgn.column + n === this._columnSections.count) {
        n -= 1;
      }
    }

    // Draw the vertical grid lines.
    for (let x = rgn.x, i = 0; i < n; ++i) {
      // Fetch the size of the column.
      let size = rgn.columnSizes[i];

      // Skip zero sized columns.
      if (size === 0) {
        continue;
      }

      let yStart = 0;
      let lineStarted = false;
      let lines = [];
      let topCurrent = y1;

      for (let r = rgn.row; r < rgn.row + rgn.rowSizes.length; r++) {
        const rIndex = r - rgn.row;
        const cellLeft = [r, rgn.column + i];
        const cellRight = [r, rgn.column + i + 1];

        if (
          CellGroup.areCellsMerged(
            this.dataModel!,
            rgn.region,
            cellLeft,
            cellRight
          )
        ) {
          if (lineStarted) {
            lines.push([yStart, topCurrent]);
          }
          lineStarted = false;
        } else {
          if (!lineStarted) {
            lineStarted = true;
            yStart = topCurrent;
          }
        }

        topCurrent += rgn.rowSizes[rIndex];
        if (r === rgn.row) {
          topCurrent -= rgn.yMin - rgn.y;
        }
      }

      if (lineStarted) {
        lines.push([yStart, rgn.yMax + 1]);
      }

      // Compute the X position of the line.
      let pos = x + size - 1;

      // Draw the line if it's in range of the dirty rect.
      if (pos >= rgn.xMin && pos <= rgn.xMax) {
        // Render entire grid if scrolling merged cells grid
        const extendLines = Private.shouldPaintEverything(this._dataModel!);
        if (extendLines) {
          for (const line of lines) {
            // this._canvasGC.strokeStyle = color;
            this._canvasGC.moveTo(pos + 0.5, line[0]);
            this._canvasGC.lineTo(pos + 0.5, line[1]);
          }
        } else {
          let y2 = Math.min(rgn.y + rgn.height, rgn.yMax + 1);
          this._canvasGC.moveTo(pos + 0.5, y1);
          this._canvasGC.lineTo(pos + 0.5, y2);
        }
      }

      // Increment the running X coordinate.
      x += size;
    }

    // Stroke the lines with the specified color.
    this._canvasGC.strokeStyle = color;
    this._canvasGC.stroke();
  }

  /**
   * Draw the body selections for the data grid.
   */
  private _drawBodySelections(): void {
    // Fetch the selection model.
    let model = this._selectionModel;

    // Bail early if there are no selections.
    if (!model || model.isEmpty) {
      return;
    }

    // Fetch the selection colors.
    let fill = this._style.selectionFillColor;
    let stroke = this._style.selectionBorderColor;

    // Bail early if there is nothing to draw.
    if (!fill && !stroke) {
      return;
    }

    // Fetch the scroll geometry.
    let sx = this._scrollX;
    let sy = this._scrollY;

    // Get the first visible cell of the grid.
    let r1 = this._rowSections.indexOf(sy);
    let c1 = this._columnSections.indexOf(sx);

    // Bail early if there are no visible cells.
    if (r1 < 0 || c1 < 0) {
      return;
    }

    // Fetch the extra geometry.
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;
    let pw = this.pageWidth;
    let ph = this.pageHeight;
    let hw = this.headerWidth;
    let hh = this.headerHeight;

    // Get the last visible cell of the grid.
    let r2 = this._rowSections.indexOf(sy + ph);
    let c2 = this._columnSections.indexOf(sx + pw);

    // Fetch the max row and column.
    let maxRow = this._rowSections.count - 1;
    let maxColumn = this._columnSections.count - 1;

    // Clamp the last cell if the void space is visible.
    r2 = r2 < 0 ? maxRow : r2;
    c2 = c2 < 0 ? maxColumn : c2;

    // Fetch the overlay gc.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Set up the body clipping rect.
    gc.beginPath();
    gc.rect(hw, hh, pw, ph);
    gc.clip();

    // Set up the gc style.
    if (fill) {
      gc.fillStyle = fill;
    }
    if (stroke) {
      gc.strokeStyle = stroke;
      gc.lineWidth = 1;
    }

    // Iterate over the selections.
    for (let s of model.selections()) {
      // Skip the section if it's not visible.
      if (s.r1 < r1 && s.r2 < r1) {
        continue;
      }
      if (s.r1 > r2 && s.r2 > r2) {
        continue;
      }
      if (s.c1 < c1 && s.c2 < c1) {
        continue;
      }
      if (s.c1 > c2 && s.c2 > c2) {
        continue;
      }

      // Clamp the cell to the model bounds.
      let sr1 = Math.max(0, Math.min(s.r1, maxRow));
      let sc1 = Math.max(0, Math.min(s.c1, maxColumn));
      let sr2 = Math.max(0, Math.min(s.r2, maxRow));
      let sc2 = Math.max(0, Math.min(s.c2, maxColumn));

      // Swap index order if needed.
      let tmp: number;
      if (sr1 > sr2) {
        tmp = sr1;
        sr1 = sr2;
        sr2 = tmp;
      }
      if (sc1 > sc2) {
        tmp = sc1;
        sc1 = sc2;
        sc2 = tmp;
      }

      const joinedGroup = CellGroup.joinCellGroupWithMergedCellGroups(
        this.dataModel!,
        { r1: sr1, r2: sr2, c1: sc1, c2: sc2 },
        'body'
      );

      sr1 = joinedGroup.r1;
      sr2 = joinedGroup.r2;
      sc1 = joinedGroup.c1;
      sc2 = joinedGroup.c2;

      // Convert to pixel coordinates.
      let x1 = this._columnSections.offsetOf(sc1) - sx + hw;
      let y1 = this._rowSections.offsetOf(sr1) - sy + hh;
      let x2 = this._columnSections.extentOf(sc2) - sx + hw;
      let y2 = this._rowSections.extentOf(sr2) - sy + hh;

      // Adjust the trailing X coordinate for column stretch.
      if (this._stretchLastColumn && pw > bw && sc2 === maxColumn) {
        x2 = hw + pw - 1;
      }

      // Adjust the trailing Y coordinate for row stretch.
      if (this._stretchLastRow && ph > bh && sr2 === maxRow) {
        y2 = hh + ph - 1;
      }

      // Clamp the bounds to just outside of the clipping rect.
      x1 = Math.max(hw - 1, x1);
      y1 = Math.max(hh - 1, y1);
      x2 = Math.min(hw + pw + 1, x2);
      y2 = Math.min(hh + ph + 1, y2);

      // Skip zero sized ranges.
      if (x2 < x1 || y2 < y1) {
        continue;
      }

      // Fill the rect if needed.
      if (fill) {
        gc.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
      }

      // Stroke the rect if needed.
      if (stroke) {
        gc.strokeRect(x1 - 0.5, y1 - 0.5, x2 - x1 + 1, y2 - y1 + 1);
      }
    }

    // Restore the gc state.
    gc.restore();
  }

  /**
   * Draw the row header selections for the data grid.
   */
  private _drawRowHeaderSelections(): void {
    // Fetch the selection model.
    let model = this._selectionModel;

    // Bail early if there are no selections or if the selectionMode is the entire column.
    if (!model || model.isEmpty || model.selectionMode == 'column') {
      return;
    }

    // Bail early if the row headers are not visible.
    if (this.headerWidth === 0 || this.pageHeight === 0) {
      return;
    }

    // Fetch the selection colors.
    let fill = this._style.headerSelectionFillColor;
    let stroke = this._style.headerSelectionBorderColor;

    // Bail early if there is nothing to draw.
    if (!fill && !stroke) {
      return;
    }

    // Fetch common geometry.
    let sy = this._scrollY;
    let bh = this.bodyHeight;
    let ph = this.pageHeight;
    let hw = this.headerWidth;
    let hh = this.headerHeight;
    let rs = this._rowSections;

    // Fetch the overlay gc.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Set up the header clipping rect.
    gc.beginPath();
    gc.rect(0, hh, hw, ph);
    gc.clip();

    // Set up the gc style.
    if (fill) {
      gc.fillStyle = fill;
    }
    if (stroke) {
      gc.strokeStyle = stroke;
      gc.lineWidth = 1;
    }

    // Fetch the max row.
    let maxRow = rs.count - 1;

    // Fetch the visible rows.
    let r1 = rs.indexOf(sy);
    let r2 = rs.indexOf(sy + ph - 1);
    r2 = r2 < 0 ? maxRow : r2;

    // Iterate over the visible rows.
    for (let j = r1; j <= r2; ++j) {
      // Skip rows which aren't selected.
      if (!model.isRowSelected(j)) {
        continue;
      }

      // Get the dimensions of the row.
      let y = rs.offsetOf(j) - sy + hh;
      let h = rs.sizeOf(j);

      // Adjust the height for row stretch.
      if (this._stretchLastRow && ph > bh && j === maxRow) {
        h = hh + ph - y;
      }

      // Skip zero sized rows.
      if (h === 0) {
        continue;
      }

      // Fill the rect if needed.
      if (fill) {
        gc.fillRect(0, y, hw, h);
      }

      // Draw the border if needed.
      if (stroke) {
        gc.beginPath();
        gc.moveTo(hw - 0.5, y - 1);
        gc.lineTo(hw - 0.5, y + h);
        gc.stroke();
      }
    }

    // Restore the gc state.
    gc.restore();
  }

  /**
   * Draw the column header selections for the data grid.
   */
  private _drawColumnHeaderSelections(): void {
    // Fetch the selection model.
    let model = this._selectionModel;

    // Bail early if there are no selections or if the selectionMode is the entire row
    if (!model || model.isEmpty || model.selectionMode == 'row') {
      return;
    }

    // Bail early if the column headers are not visible.
    if (this.headerHeight === 0 || this.pageWidth === 0) {
      return;
    }

    // Fetch the selection colors.
    let fill = this._style.headerSelectionFillColor;
    let stroke = this._style.headerSelectionBorderColor;

    // Bail early if there is nothing to draw.
    if (!fill && !stroke) {
      return;
    }

    // Fetch common geometry.
    let sx = this._scrollX;
    let bw = this.bodyWidth;
    let pw = this.pageWidth;
    let hw = this.headerWidth;
    let hh = this.headerHeight;
    let cs = this._columnSections;

    // Fetch the overlay gc.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Set up the header clipping rect.
    gc.beginPath();
    gc.rect(hw, 0, pw, hh);
    gc.clip();

    // Set up the gc style.
    if (fill) {
      gc.fillStyle = fill;
    }
    if (stroke) {
      gc.strokeStyle = stroke;
      gc.lineWidth = 1;
    }

    // Fetch the max column.
    let maxCol = cs.count - 1;

    // Fetch the visible columns.
    let c1 = cs.indexOf(sx);
    let c2 = cs.indexOf(sx + pw - 1);
    c2 = c2 < 0 ? maxCol : c2;

    // Iterate over the visible columns.
    for (let i = c1; i <= c2; ++i) {
      // Skip columns which aren't selected.
      if (!model.isColumnSelected(i)) {
        continue;
      }

      // Get the dimensions of the column.
      let x = cs.offsetOf(i) - sx + hw;
      let w = cs.sizeOf(i);

      // Adjust the width for column stretch.
      if (this._stretchLastColumn && pw > bw && i === maxCol) {
        w = hw + pw - x;
      }

      // Skip zero sized columns.
      if (w === 0) {
        continue;
      }

      // Fill the rect if needed.
      if (fill) {
        gc.fillRect(x, 0, w, hh);
      }

      // Draw the border if needed.
      if (stroke) {
        gc.beginPath();
        gc.moveTo(x - 1, hh - 0.5);
        gc.lineTo(x + w, hh - 0.5);
        gc.stroke();
      }
    }

    // Restore the gc state.
    gc.restore();
  }

  /**
   * Draw the overlay cursor for the data grid.
   */
  private _drawCursor(): void {
    // Fetch the selection model.
    let model = this._selectionModel;

    // Bail early if there is no cursor.
    if (!model || model.isEmpty || model.selectionMode !== 'cell') {
      return;
    }

    // Extract the style information.
    let fill = this._style.cursorFillColor;
    let stroke = this._style.cursorBorderColor;

    // Bail early if there is nothing to draw.
    if (!fill && !stroke) {
      return;
    }

    // Fetch the cursor location.
    let startRow = model.cursorRow;
    let startColumn = model.cursorColumn;

    // Fetch the max row and column.
    let maxRow = this._rowSections.count - 1;
    let maxColumn = this._columnSections.count - 1;

    // Bail early if the cursor is out of bounds.
    if (startRow < 0 || startRow > maxRow) {
      return;
    }
    if (startColumn < 0 || startColumn > maxColumn) {
      return;
    }

    let endRow = startRow;
    let endColumn = startColumn;

    const joinedGroup = CellGroup.joinCellGroupWithMergedCellGroups(
      this.dataModel!,
      { r1: startRow, r2: endRow, c1: startColumn, c2: endColumn },
      'body'
    );

    startRow = joinedGroup.r1;
    endRow = joinedGroup.r2;
    startColumn = joinedGroup.c1;
    endColumn = joinedGroup.c2;

    // Fetch geometry.
    let sx = this._scrollX;
    let sy = this._scrollY;
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;
    let pw = this.pageWidth;
    let ph = this.pageHeight;
    let hw = this.headerWidth;
    let hh = this.headerHeight;
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // Get the cursor bounds in viewport coordinates.
    let x1 = this._columnSections.offsetOf(startColumn) - sx + hw;
    let x2 = this._columnSections.extentOf(endColumn) - sx + hw;
    let y1 = this._rowSections.offsetOf(startRow) - sy + hh;
    let y2 = this._rowSections.extentOf(endRow) - sy + hh;

    // Adjust the trailing X coordinate for column stretch.
    if (this._stretchLastColumn && pw > bw && startColumn === maxColumn) {
      x2 = vw - 1;
    }

    // Adjust the trailing Y coordinate for row stretch.
    if (this._stretchLastRow && ph > bh && startRow === maxRow) {
      y2 = vh - 1;
    }

    // Skip zero sized cursors.
    if (x2 < x1 || y2 < y1) {
      return;
    }

    // Bail early if the cursor is off the screen.
    if (x1 - 1 >= vw || y1 - 1 >= vh || x2 + 1 < hw || y2 + 1 < hh) {
      return;
    }

    // Fetch the overlay gc.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Set up the body clipping rect.
    gc.beginPath();
    gc.rect(hw, hh, pw, ph);
    gc.clip();

    // Clear any existing overlay content.
    gc.clearRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);

    // Fill the cursor rect if needed.
    if (fill) {
      // Set up the fill style.
      gc.fillStyle = fill;

      // Fill the cursor rect.
      gc.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
    }

    // Stroke the cursor border if needed.
    if (stroke) {
      // Set up the stroke style.
      gc.strokeStyle = stroke;
      gc.lineWidth = 2;

      // Stroke the cursor rect.
      gc.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    // Restore the gc state.
    gc.restore();
  }

  /**
   * Draw the overlay shadows for the data grid.
   */
  private _drawShadows(): void {
    // Fetch the scroll shadow from the style.
    let shadow = this._style.scrollShadow;

    // Bail early if there is no shadow to draw.
    if (!shadow) {
      return;
    }

    // Fetch the scroll position.
    let sx = this._scrollX;
    let sy = this._scrollY;

    // Fetch maximum scroll position.
    let sxMax = this.maxScrollX;
    let syMax = this.maxScrollY;

    // Fetch the header width and height.
    let hw = this.headerWidth;
    let hh = this.headerHeight;

    // Fetch the page width and height.
    let pw = this.pageWidth;
    let ph = this.pageHeight;

    // Fetch the viewport width and height.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // Fetch the body width and height.
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;

    // Adjust the body size for row and column stretch.
    if (this._stretchLastRow && ph > bh) {
      bh = ph;
    }
    if (this._stretchLastColumn && pw > bw) {
      bw = pw;
    }

    // Fetch the gc object.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Draw the column header shadow if needed.
    if (sy > 0) {
      // Set up the gradient coordinates.
      let x0 = 0;
      let y0 = hh;
      let x1 = 0;
      let y1 = y0 + shadow.size;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = 0;
      let y = hh;
      let w = hw + Math.min(pw, bw - sx);
      let h = shadow.size;

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Draw the row header shadow if needed.
    if (sx > 0) {
      // Set up the gradient coordinates.
      let x0 = hw;
      let y0 = 0;
      let x1 = x0 + shadow.size;
      let y1 = 0;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = hw;
      let y = 0;
      let w = shadow.size;
      let h = hh + Math.min(ph, bh - sy);

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Draw the column footer shadow if needed.
    if (sy < syMax) {
      // Set up the gradient coordinates.
      let x0 = 0;
      let y0 = vh;
      let x1 = 0;
      let y1 = vh - shadow.size;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = 0;
      let y = vh - shadow.size;
      let w = hw + Math.min(pw, bw - sx);
      let h = shadow.size;

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Draw the row footer shadow if needed.
    if (sx < sxMax) {
      // Set up the gradient coordinates.
      let x0 = vw;
      let y0 = 0;
      let x1 = vw - shadow.size;
      let y1 = 0;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = vw - shadow.size;
      let y = 0;
      let w = shadow.size;
      let h = hh + Math.min(ph, bh - sy);

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Restore the gc state.
    gc.restore();
  }

  private _viewport: Widget;
  private _vScrollBar: ScrollBar;
  private _hScrollBar: ScrollBar;
  private _scrollCorner: Widget;

  private _scrollX = 0;
  private _scrollY = 0;
  private _viewportWidth = 0;
  private _viewportHeight = 0;

  private _mousedown = false;
  private _keyHandler: DataGrid.IKeyHandler | null = null;
  private _mouseHandler: DataGrid.IMouseHandler | null = null;

  private _vScrollBarMinWidth = 0;
  private _hScrollBarMinHeight = 0;
  private _dpiRatio = Math.ceil(window.devicePixelRatio);

  private _canvas: HTMLCanvasElement;
  private _buffer: HTMLCanvasElement;
  private _overlay: HTMLCanvasElement;
  private _canvasGC: CanvasRenderingContext2D;
  private _bufferGC: CanvasRenderingContext2D;
  private _overlayGC: CanvasRenderingContext2D;

  private _rowSections: SectionList;
  private _columnSections: SectionList;
  private _rowHeaderSections: SectionList;
  private _columnHeaderSections: SectionList;

  private _dataModel: DataModel | null = null;
  private _selectionModel: SelectionModel | null = null;

  private _stretchLastRow: boolean;
  private _stretchLastColumn: boolean;

  private _style: DataGrid.Style;
  private _cellRenderers: RendererMap;
  private _copyConfig: DataGrid.CopyConfig;
  private _headerVisibility: DataGrid.HeaderVisibility;
  private _editorController: ICellEditorController | null;
  private _editingEnabled: boolean = false;
}

/**
 * The namespace for the `DataGrid` class statics.
 */
export namespace DataGrid {
  /**
   * An object which defines the style for a data grid.
   *
   * #### Notes
   * All style colors support the full CSS color syntax.
   */
  export type Style = {
    /**
     * The void color for the data grid.
     *
     * This is the base fill color for the entire data grid.
     */
    readonly voidColor?: string;

    /**
     * The background color for the body cells.
     *
     * This color is layered on top of the `voidColor`.
     */
    readonly backgroundColor?: string;

    /**
     * A function which returns the background color for a row.
     *
     * This color is layered on top of the `backgroundColor` and can
     * be used to implement "zebra striping" of the grid rows.
     */
    readonly rowBackgroundColor?: (index: number) => string;

    /**
     * A function which returns the background color for a column.
     *
     * This color is layered on top of the `backgroundColor` and can
     * be used to implement "zebra striping" of the grid columns.
     */
    readonly columnBackgroundColor?: (index: number) => string;

    /**
     * The color for the grid lines of the body cells.
     *
     * The grid lines are draw on top of the cell contents.
     */
    readonly gridLineColor?: string;

    /**
     * The color for the vertical grid lines of the body cells.
     *
     * This overrides the `gridLineColor` option.
     */
    readonly verticalGridLineColor?: string;

    /**
     * The color for the horizontal grid lines of the body cells.
     *
     * This overrides the `gridLineColor` option.
     */
    readonly horizontalGridLineColor?: string;

    /**
     * The background color for the header cells.
     *
     * This color is layered on top of the `voidColor`.
     */
    readonly headerBackgroundColor?: string;

    /**
     * The color for the grid lines of the header cells.
     *
     * The grid lines are draw on top of the cell contents.
     */
    readonly headerGridLineColor?: string;

    /**
     * The color for the vertical grid lines of the header cells.
     *
     * This overrides the `headerGridLineColor` option.
     */
    readonly headerVerticalGridLineColor?: string;

    /**
     * The color for the horizontal grid lines of the header cells.
     *
     * This overrides the `headerGridLineColor` option.
     */
    readonly headerHorizontalGridLineColor?: string;

    /**
     * The fill color for a selection.
     */
    readonly selectionFillColor?: string;

    /**
     * The border color for a selection.
     */
    readonly selectionBorderColor?: string;

    /**
     * The fill color for the cursor.
     */
    readonly cursorFillColor?: string;

    /**
     * The border color for the cursor.
     */
    readonly cursorBorderColor?: string;

    /**
     * The fill color for a header selection.
     */
    readonly headerSelectionFillColor?: string;

    /**
     * The border color for a header selection.
     */
    readonly headerSelectionBorderColor?: string;

    /**
     * The drop shadow effect when the grid is scrolled.
     */
    readonly scrollShadow?: {
      /**
       * The size of the shadow, in pixels.
       */
      readonly size: number;

      /**
       * The first color stop for the shadow.
       */
      readonly color1: string;

      /**
       * The second color stop for the shadow.
       */
      readonly color2: string;

      /**
       * The third color stop for the shadow.
       */
      readonly color3: string;
    };
  };

  /**
   * An object which defines the default sizes for a data grid.
   */
  export type DefaultSizes = {
    /**
     * The default height of a row.
     */
    readonly rowHeight: number;

    /**
     * The default width of a column.
     */
    readonly columnWidth: number;

    /**
     * The default width of a row header.
     */
    readonly rowHeaderWidth: number;

    /**
     * The default height of a column header.
     */
    readonly columnHeaderHeight: number;
  };

  /**
   * An object which defines the minimum sizes for a data grid.
   */
  export type MinimumSizes = {
    /**
     * The minimum height of a row.
     */
    readonly rowHeight: number;

    /**
     * The minimum width of a column.
     */
    readonly columnWidth: number;

    /**
     * The minimum width of a row header.
     */
    readonly rowHeaderWidth: number;

    /**
     * The minimum height of a column header.
     */
    readonly columnHeaderHeight: number;
  };

  /**
   * A type alias for the supported header visibility modes.
   */
  export type HeaderVisibility = 'all' | 'row' | 'column' | 'none';

  /**
   * A type alias for the supported column auto resize modes.
   */
  export type ColumnFitType = 'all' | 'row-header' | 'body';

  /**
   * A type alias for the arguments to a copy format function.
   */
  export type CopyFormatArgs = {
    /**
     * The cell region for the value.
     */
    region: DataModel.CellRegion;

    /**
     * The row index of the value.
     */
    row: number;

    /**
     * The column index of the value.
     */
    column: number;

    /**
     * The value for the cell.
     */
    value: any;

    /**
     * The metadata for the cell.
     */
    metadata: DataModel.Metadata;
  };

  /**
   * A type alias for a copy format function.
   */
  export type CopyFormatFunc = (args: CopyFormatArgs) => string;

  /**
   * A type alias for the data grid copy config.
   */
  export type CopyConfig = {
    /**
     * The separator to use between values.
     */
    readonly separator: string;

    /**
     * The headers to included in the copied output.
     */
    readonly headers: 'none' | 'row' | 'column' | 'all';

    /**
     * The function for formatting the data values.
     */
    readonly format: CopyFormatFunc;

    /**
     * The cell count threshold for a copy to be considered "large".
     */
    readonly warningThreshold: number;
  };

  /**
   * An options object for initializing a data grid.
   */
  export interface IOptions {
    /**
     * The style for the data grid.
     *
     * The default is `DataGrid.defaultStyle`.
     */
    style?: Style;

    /**
     * The default sizes for the data grid.
     *
     * The default is `DataGrid.defaultSizes`.
     */
    defaultSizes?: DefaultSizes;

    /**
     * The minimum sizes for the data grid.
     *
     * The default is `DataGrid.minimumSizes`.
     */
    minimumSizes?: MinimumSizes;

    /**
     * The header visibility for the data grid.
     *
     * The default is `'all'`.
     */
    headerVisibility?: HeaderVisibility;

    /**
     * The cell renderer map for the data grid.
     *
     * The default is an empty renderer map.
     */
    cellRenderers?: RendererMap;

    /**
     * The default cell renderer for the data grid.
     *
     * The default is a new `TextRenderer`.
     */
    defaultRenderer?: CellRenderer;

    /**
     * The copy configuration data for the grid.
     *
     * The default is `DataGrid.defaultCopyConfig`.
     */
    copyConfig?: CopyConfig;

    /**
     * Whether to stretch the last row of the grid.
     *
     * The default is `false`.
     */
    stretchLastRow?: boolean;

    /**
     * Whether to stretch the last column of the grid.
     *
     * The default is `false`.
     */
    stretchLastColumn?: boolean;
  }

  /**
   * An object which handles keydown events for the data grid.
   */
  export interface IKeyHandler extends IDisposable {
    /**
     * Handle the key down event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The keydown event of interest.
     *
     * #### Notes
     * This will not be called if the mouse button is pressed.
     */
    onKeyDown(grid: DataGrid, event: KeyboardEvent): void;
  }

  /**
   * An object which handles mouse events for the data grid.
   */
  export interface IMouseHandler extends IDisposable {
    /**
     * Release any resources acquired during a mouse press.
     *
     * #### Notes
     * This method is called when the mouse should be released
     * independent of a mouseup event, such as an early detach.
     */
    release(): void;

    /**
     * Handle the mouse hover event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse hover event of interest.
     */
    onMouseHover(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse leave event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse hover event of interest.
     */
    onMouseLeave(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse down event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse down event of interest.
     */
    onMouseDown(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse move event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse move event of interest.
     */
    onMouseMove(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse up event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse up event of interest.
     */
    onMouseUp(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse double click event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse double click event of interest.
     */
    onMouseDoubleClick(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the context menu event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The context menu event of interest.
     */
    onContextMenu(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the wheel event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The wheel event of interest.
     */
    onWheel(grid: DataGrid, event: WheelEvent): void;
  }

  /**
   * An object which holds the result of a grid hit test.
   */
  export type HitTestResult = {
    /**
     * The region of the data grid that was hit.
     */
    readonly region: DataModel.CellRegion | 'void';

    /**
     * The row index of the cell that was hit.
     *
     * This is `-1` for the `void` region.
     */
    readonly row: number;

    /**
     * The column index of the cell that was hit.
     *
     * This is `-1` for the `void` region.
     */
    readonly column: number;

    /**
     * The X coordinate of the mouse in cell coordinates.
     *
     * This is `-1` for the `void` region.
     */
    readonly x: number;

    /**
     * The Y coordinate of the mouse in cell coordinates.
     *
     * This is `-1` for the `void` region.
     */
    readonly y: number;

    /**
     * The width of the cell.
     *
     * This is `-1` for the `void` region.
     */
    readonly width: number;

    /**
     * The height of the cell.
     *
     * This is `-1` for the `void` region.
     */
    readonly height: number;
  };

  /**
   * A generic format function for the copy handler.
   *
   * @param args - The format args for the function.
   *
   * @returns The string representation of the value.
   *
   * #### Notes
   * This function uses `String()` to coerce a value to a string.
   */
  export function copyFormatGeneric(args: CopyFormatArgs): string {
    if (args.value === null || args.value === undefined) {
      return '';
    }
    return String(args.value);
  }

  /**
   * The default theme for a data grid.
   */
  export const defaultStyle: Style = {
    voidColor: '#F3F3F3',
    backgroundColor: '#FFFFFF',
    gridLineColor: 'rgba(20, 20, 20, 0.15)',
    headerBackgroundColor: '#F3F3F3',
    headerGridLineColor: 'rgba(20, 20, 20, 0.25)',
    selectionFillColor: 'rgba(49, 119, 229, 0.2)',
    selectionBorderColor: 'rgba(0, 107, 247, 1.0)',
    cursorBorderColor: 'rgba(0, 107, 247, 1.0)',
    headerSelectionFillColor: 'rgba(20, 20, 20, 0.1)',
    headerSelectionBorderColor: 'rgba(0, 107, 247, 1.0)',
    scrollShadow: {
      size: 10,
      color1: 'rgba(0, 0, 0, 0.20)',
      color2: 'rgba(0, 0, 0, 0.05)',
      color3: 'rgba(0, 0, 0, 0.00)'
    }
  };

  /**
   * The default sizes for a data grid.
   */
  export const defaultSizes: DefaultSizes = {
    rowHeight: 20,
    columnWidth: 64,
    rowHeaderWidth: 64,
    columnHeaderHeight: 20
  };

  /**
   * The default minimum sizes for a data grid.
   */
  export const minimumSizes: MinimumSizes = {
    rowHeight: 20,
    columnWidth: 10,
    rowHeaderWidth: 10,
    columnHeaderHeight: 20
  };

  /**
   * The default copy config for a data grid.
   */
  export const defaultCopyConfig: CopyConfig = {
    separator: '\t',
    format: copyFormatGeneric,
    headers: 'none',
    warningThreshold: 1e6
  };
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A singleton `scroll-request` conflatable message.
   */
  export const ScrollRequest = new ConflatableMessage('scroll-request');

  /**
   * A singleton `overlay-paint-request` conflatable message.
   */
  export const OverlayPaintRequest = new ConflatableMessage(
    'overlay-paint-request'
  );

  /**
   * Create a new zero-sized canvas element.
   */
  export function createCanvas(): HTMLCanvasElement {
    let canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    return canvas;
  }

  /**
   * A function to check whether the entire grid should be rendered
   * when dealing with merged cell regions.
   * @param dataModel grid's data model.
   * @returns boolean.
   */
  export function shouldPaintEverything(dataModel: DataModel): boolean {
    const colGroups = CellGroup.getCellGroupsAtRegion(
      dataModel!,
      'column-header'
    );
    const rowHeaderGroups = CellGroup.getCellGroupsAtRegion(
      dataModel!,
      'row-header'
    );
    const cornerHeaderGroups = CellGroup.getCellGroupsAtRegion(
      dataModel!,
      'corner-header'
    );
    const bodyGroups = CellGroup.getCellGroupsAtRegion(dataModel!, 'body');
    return (
      colGroups.length > 0 ||
      rowHeaderGroups.length > 0 ||
      cornerHeaderGroups.length > 0 ||
      bodyGroups.length > 0
    );
  }

  /**
   * Checks whether a given regions has merged cells in it.
   * @param dataModel grid's data model.
   * @param region the paint region to be checked.
   * @returns boolean.
   */
  export function regionHasMergedCells(
    dataModel: DataModel,
    region: DataModel.CellRegion
  ): boolean {
    const regionGroups = CellGroup.getCellGroupsAtRegion(dataModel!, region);
    return regionGroups.length > 0;
  }

  /**
   * An object which represents a region to be painted.
   */
  export type PaintRegion = {
    /**
     * The min X coordinate the of the dirty viewport rect.
     *
     * #### Notes
     * The data grid must not draw outside of this boundary.
     */
    xMin: number;

    /**
     * The min Y coordinate the of the dirty viewport rect.
     *
     * #### Notes
     * The data grid must not draw outside of this boundary.
     */
    yMin: number;

    /**
     * The max X coordinate the of the dirty viewport rect.
     *
     * #### Notes
     * The data grid must not draw outside of this boundary.
     */
    xMax: number;

    /**
     * The max Y coordinate the of the dirty viewport rect.
     *
     * #### Notes
     * The data grid must not draw outside of this boundary.
     */
    yMax: number;

    /**
     * The X coordinate the of the region, in viewport coordinates.
     *
     * #### Notes
     * This is aligned to the first cell boundary.
     */
    x: number;

    /**
     * The Y coordinate the of the region, in viewport coordinates.
     *
     * #### Notes
     * This is aligned to the first cell boundary.
     */
    y: number;

    /**
     * The total width of the region.
     *
     * #### Notes
     * This is aligned to the cell boundaries.
     */
    width: number;

    /**
     * The total height of the region.
     *
     * #### Notes
     * This is aligned to the cell boundaries.
     */
    height: number;

    /**
     * The cell region being painted.
     */
    region: DataModel.CellRegion;

    /**
     * The row index of the first cell in the region.
     */
    row: number;

    /**
     * The column index of the first cell in the region.
     */
    column: number;

    /**
     * The row sizes for the rows in the region.
     */
    rowSizes: number[];

    /**
     * The column sizes for the columns in the region.
     */
    columnSizes: number[];
  };

  /**
   * A conflatable message which merges dirty paint regions.
   */
  export class PaintRequest extends ConflatableMessage {
    /**
     * Construct a new paint request messages.
     *
     * @param region - The cell region for the paint.
     *
     * @param r1 - The top-left row of the dirty region.
     *
     * @param c1 - The top-left column of the dirty region.
     *
     * @param r2 - The bottom-right row of the dirty region.
     *
     * @param c2 - The bottom-right column of the dirty region.
     */
    constructor(
      region: DataModel.CellRegion | 'all',
      r1: number,
      c1: number,
      r2: number,
      c2: number
    ) {
      super('paint-request');
      this._region = region;
      this._r1 = r1;
      this._c1 = c1;
      this._r2 = r2;
      this._c2 = c2;
    }

    /**
     * The cell region for the paint.
     */
    get region(): DataModel.CellRegion | 'all' {
      return this._region;
    }

    /**
     * The top-left row of the dirty region.
     */
    get r1(): number {
      return this._r1;
    }

    /**
     * The top-left column of the dirty region.
     */
    get c1(): number {
      return this._c1;
    }

    /**
     * The bottom-right row of the dirty region.
     */
    get r2(): number {
      return this._r2;
    }

    /**
     * The bottom-right column of the dirty region.
     */
    get c2(): number {
      return this._c2;
    }

    /**
     * Conflate this message with another paint request.
     */
    conflate(other: PaintRequest): boolean {
      // Bail early if the request is already painting everything.
      if (this._region === 'all') {
        return true;
      }

      // Any region can conflate with the `'all'` region.
      if (other._region === 'all') {
        this._region = 'all';
        return true;
      }

      // Otherwise, do not conflate with a different region.
      if (this._region !== other._region) {
        return false;
      }

      // Conflate the region to the total boundary.
      this._r1 = Math.min(this._r1, other._r1);
      this._c1 = Math.min(this._c1, other._c1);
      this._r2 = Math.max(this._r2, other._r2);
      this._c2 = Math.max(this._c2, other._c2);
      return true;
    }

    private _region: DataModel.CellRegion | 'all';
    private _r1: number;
    private _c1: number;
    private _r2: number;
    private _c2: number;
  }

  /**
   * A conflatable message for resizing rows.
   */
  export class RowResizeRequest extends ConflatableMessage {
    /**
     * Construct a new row resize request.
     *
     * @param region - The row region which holds the section.
     *
     * @param index - The index of row in the region.
     *
     * @param size - The target size of the section.
     */
    constructor(region: DataModel.RowRegion, index: number, size: number) {
      super('row-resize-request');
      this._region = region;
      this._index = index;
      this._size = size;
    }

    /**
     * The row region which holds the section.
     */
    get region(): DataModel.RowRegion {
      return this._region;
    }

    /**
     * The index of the row in the region.
     */
    get index(): number {
      return this._index;
    }

    /**
     * The target size of the section.
     */
    get size(): number {
      return this._size;
    }

    /**
     * Conflate this message with another row resize request.
     */
    conflate(other: RowResizeRequest): boolean {
      if (this._region !== other._region || this._index !== other._index) {
        return false;
      }
      this._size = other._size;
      return true;
    }

    private _region: DataModel.RowRegion;
    private _index: number;
    private _size: number;
  }

  /**
   * A conflatable message for resizing columns.
   */
  export class ColumnResizeRequest extends ConflatableMessage {
    /**
     * Construct a new column resize request.
     *
     * @param region - The column region which holds the section.
     *
     * @param index - The index of column in the region.
     *
     * @param size - The target size of the section.
     */
    constructor(region: DataModel.ColumnRegion, index: number, size: number) {
      super('column-resize-request');
      this._region = region;
      this._index = index;
      this._size = size;
    }

    /**
     * The column region which holds the section.
     */
    get region(): DataModel.ColumnRegion {
      return this._region;
    }

    /**
     * The index of the column in the region.
     */
    get index(): number {
      return this._index;
    }

    /**
     * The target size of the section.
     */
    get size(): number {
      return this._size;
    }

    /**
     * Conflate this message with another column resize request.
     */
    conflate(other: ColumnResizeRequest): boolean {
      if (this._region !== other._region || this._index !== other._index) {
        return false;
      }
      this._size = other._size;
      return true;
    }

    private _region: DataModel.ColumnRegion;
    private _index: number;
    private _size: number;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ISignal, Signal } from '@lumino/signaling';

import { CellGroup } from './cellgroup';
/**
 * An object which provides the data for a data grid.
 *
 * #### Notes
 * If the predefined data models are insufficient for a particular use
 * case, a custom model can be defined which derives from this class.
 */
export abstract class DataModel {
  /**
   * A signal emitted when the data model has changed.
   */
  get changed(): ISignal<this, DataModel.ChangedArgs> {
    return this._changed;
  }

  /**
   * Get the row count for a region in the data model.
   *
   * @param region - The row region of interest.
   *
   * @returns - The row count for the region.
   *
   * #### Notes
   * This method is called often, and so should be efficient.
   */
  abstract rowCount(region: DataModel.RowRegion): number;

  /**
   * Get the column count for a region in the data model.
   *
   * @param region - The column region of interest.
   *
   * @returns - The column count for the region.
   *
   * #### Notes
   * This method is called often, and so should be efficient.
   */
  abstract columnCount(region: DataModel.ColumnRegion): number;

  /**
   * Get the data value for a cell in the data model.
   *
   * @param region - The cell region of interest.
   *
   * @param row - The row index of the cell of interest.
   *
   * @param column - The column index of the cell of interest.
   *
   * @returns The data value for the specified cell.
   *
   * #### Notes
   * The returned data should be treated as immutable.
   *
   * This method is called often, and so should be efficient.
   */
  abstract data(region: DataModel.CellRegion, row: number, column: number): any;

  /**
   * Get the count of merged cell groups pertaining to a given
   * cell region.
   * @param region the target cell region.
   */
  groupCount(region: DataModel.CellRegion): number {
    return 0;
  }

  /**
   * Get the metadata for a cell in the data model.
   *
   * @param region - The cell region of interest.
   *
   * @param row - The row index of the cell of interest.
   *
   * @param column - The column index of the cell of interest.
   *
   * @returns The metadata for the specified cell.
   *
   * #### Notes
   * The returned metadata should be treated as immutable.
   *
   * This method is called often, and so should be efficient.
   *
   * The default implementation returns `{}`.
   */
  metadata(
    region: DataModel.CellRegion,
    row: number,
    column: number
  ): DataModel.Metadata {
    return DataModel.emptyMetadata;
  }

  /**
   * Get the merged cell group corresponding to a region and index number.
   * @param region the cell region of cell group.
   * @param groupIndex the group index of the cell group.
   * @returns a cell group.
   */
  group(region: DataModel.CellRegion, groupIndex: number): CellGroup | null {
    return null;
  }

  /**
   * Emit the `changed` signal for the data model.
   *
   * #### Notes
   * Subclasses should call this method whenever the data model has
   * changed so that attached data grids can update themselves.
   */
  protected emitChanged(args: DataModel.ChangedArgs): void {
    this._changed.emit(args);
  }

  private _changed = new Signal<this, DataModel.ChangedArgs>(this);
}

/**
 * An object which provides the mutable data for a data grid.
 *
 * #### Notes
 * This object is an extension to `DataModel` and it only adds ability to
 * change data for cells.
 */
export abstract class MutableDataModel extends DataModel {
  /**
   * Set the data value for a cell in the data model.
   *
   * @param region - The cell region of interest.
   *
   * @param row - The row index of the cell of interest.
   *
   * @param column - The column index of the cell of interest.
   *
   * @returns true if succeeds, false otherwise.
   *
   */
  abstract setData(
    region: DataModel.CellRegion,
    row: number,
    column: number,
    value: unknown
  ): boolean;
}

/**
 * The namespace for the `DataModel` class statics.
 */
export namespace DataModel {
  /**
   * A type alias for the data model row regions.
   */
  export type RowRegion = 'body' | 'column-header';

  /**
   * A type alias for the data model column regions.
   */
  export type ColumnRegion = 'body' | 'row-header';

  /**
   * A type alias for the data model cell regions.
   */
  export type CellRegion =
    | 'body'
    | 'row-header'
    | 'column-header'
    | 'corner-header';

  /**
   * The metadata for a column in a data model.
   */
  export type Metadata = { [key: string]: any };

  /**
   * A singleton empty metadata object.
   */
  export const emptyMetadata: Metadata = Object.freeze({});

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when rows are inserted or removed.
   */
  export type RowsChangedArgs = {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'rows-inserted' | 'rows-removed';

    /**
     * The region which contains the modified rows.
     */
    readonly region: RowRegion;

    /**
     * The index of the first modified row.
     */
    readonly index: number;

    /**
     * The number of modified rows.
     */
    readonly span: number;
  };

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when columns are inserted or removed.
   */
  export type ColumnsChangedArgs = {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'columns-inserted' | 'columns-removed';

    /**
     * The region which contains the modified columns.
     */
    readonly region: ColumnRegion;

    /**
     * The index of the first modified column.
     */
    readonly index: number;

    /**
     * The number of modified columns.
     */
    readonly span: number;
  };

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when rows are moved.
   */
  export type RowsMovedArgs = {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'rows-moved';

    /**
     * The region which contains the modified rows.
     */
    readonly region: RowRegion;

    /**
     * The starting index of the first modified row.
     */
    readonly index: number;

    /**
     * The number of modified rows.
     */
    readonly span: number;

    /**
     * The ending index of the first modified row.
     */
    readonly destination: number;
  };

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when columns are moved.
   */
  export type ColumnsMovedArgs = {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'columns-moved';

    /**
     * The region which contains the modified columns.
     */
    readonly region: ColumnRegion;

    /**
     * The starting index of the first modified column.
     */
    readonly index: number;

    /**
     * The number of modified columns.
     */
    readonly span: number;

    /**
     * The ending index of the first modified column.
     */
    readonly destination: number;
  };

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when cells are changed in-place.
   */
  export type CellsChangedArgs = {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'cells-changed';

    /**
     * The region which contains the modified cells.
     */
    readonly region: CellRegion;

    /**
     * The row index of the first modified cell.
     */
    readonly row: number;

    /**
     * The column index of the first modified cell.
     */
    readonly column: number;

    /**
     * The number of rows in the modified cell range.
     */
    readonly rowSpan: number;

    /**
     * The number of columns in the modified cell range.
     */
    readonly columnSpan: number;
  };

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when the model has changed in a fashion that cannot be easily
   * expressed by the other args object types.
   *
   * This is the "big hammer" approach, and will cause any associated
   * data grid to perform a full reset. The other changed args types
   * should be used whenever possible.
   */
  export type ModelResetArgs = {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'model-reset';
  };

  /**
   * A type alias for the args objects of the `changed` signal.
   */
  export type ChangedArgs =
    | RowsChangedArgs
    | ColumnsChangedArgs
    | RowsMovedArgs
    | ColumnsMovedArgs
    | CellsChangedArgs
    | ModelResetArgs;
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { IDisposable } from '@lumino/disposable';

/**
 * A thin caching wrapper around a 2D canvas rendering context.
 *
 * #### Notes
 * This class is mostly a transparent wrapper around a canvas rendering
 * context which improves performance when writing context state.
 *
 * For best performance, avoid reading state from the `gc`. Writes are
 * cached based on the previously written value.
 *
 * Unless otherwise specified, the API and semantics of this class are
 * identical to the builtin 2D canvas rendering context:
 * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 *
 * The wrapped canvas context should not be manipulated externally
 * until the wrapping `GraphicsContext` object is disposed.
 */
export class GraphicsContext implements IDisposable {
  /**
   * Create a new graphics context object.
   *
   * @param context - The 2D canvas rendering context to wrap.
   */
  constructor(context: CanvasRenderingContext2D) {
    this._context = context;
    this._state = Private.State.create(context);
  }

  dispose(): void {
    // Bail if the gc is already disposed.
    if (this._disposed) {
      return;
    }

    // Mark the gc as disposed.
    this._disposed = true;

    // Pop any unrestored saves.
    while (this._state.next) {
      this._state = this._state.next;
      this._context.restore();
    }
  }

  get isDisposed(): boolean {
    return this._disposed;
  }

  get fillStyle(): string | CanvasGradient | CanvasPattern {
    return this._context.fillStyle;
  }

  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    if (this._state.fillStyle !== value) {
      this._state.fillStyle = value;
      this._context.fillStyle = value;
    }
  }

  get strokeStyle(): string | CanvasGradient | CanvasPattern {
    return this._context.strokeStyle;
  }

  set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
    if (this._state.strokeStyle !== value) {
      this._state.strokeStyle = value;
      this._context.strokeStyle = value;
    }
  }

  get font(): string {
    return this._context.font;
  }

  set font(value: string) {
    if (this._state.font !== value) {
      this._state.font = value;
      this._context.font = value;
    }
  }

  get textAlign(): CanvasTextAlign {
    return this._context.textAlign;
  }

  set textAlign(value: CanvasTextAlign) {
    if (this._state.textAlign !== value) {
      this._state.textAlign = value;
      this._context.textAlign = value;
    }
  }

  get textBaseline(): CanvasTextBaseline {
    return this._context.textBaseline;
  }

  set textBaseline(value: CanvasTextBaseline) {
    if (this._state.textBaseline !== value) {
      this._state.textBaseline = value;
      this._context.textBaseline = value;
    }
  }

  get lineCap(): CanvasLineCap {
    return this._context.lineCap;
  }

  set lineCap(value: CanvasLineCap) {
    if (this._state.lineCap !== value) {
      this._state.lineCap = value;
      this._context.lineCap = value;
    }
  }

  get lineDashOffset(): number {
    return this._context.lineDashOffset;
  }

  set lineDashOffset(value: number) {
    if (this._state.lineDashOffset !== value) {
      this._state.lineDashOffset = value;
      this._context.lineDashOffset = value;
    }
  }

  get lineJoin(): CanvasLineJoin {
    return this._context.lineJoin;
  }

  set lineJoin(value: CanvasLineJoin) {
    if (this._state.lineJoin !== value) {
      this._state.lineJoin = value;
      this._context.lineJoin = value;
    }
  }

  get lineWidth(): number {
    return this._context.lineWidth;
  }

  set lineWidth(value: number) {
    if (this._state.lineWidth !== value) {
      this._state.lineWidth = value;
      this._context.lineWidth = value;
    }
  }

  get miterLimit(): number {
    return this._context.miterLimit;
  }

  set miterLimit(value: number) {
    if (this._state.miterLimit !== value) {
      this._state.miterLimit = value;
      this._context.miterLimit = value;
    }
  }

  get shadowBlur(): number {
    return this._context.shadowBlur;
  }

  set shadowBlur(value: number) {
    if (this._state.shadowBlur !== value) {
      this._state.shadowBlur = value;
      this._context.shadowBlur = value;
    }
  }

  get shadowColor(): string {
    return this._context.shadowColor;
  }

  set shadowColor(value: string) {
    if (this._state.shadowColor !== value) {
      this._state.shadowColor = value;
      this._context.shadowColor = value;
    }
  }

  get shadowOffsetX(): number {
    return this._context.shadowOffsetX;
  }

  set shadowOffsetX(value: number) {
    if (this._state.shadowOffsetX !== value) {
      this._state.shadowOffsetX = value;
      this._context.shadowOffsetX = value;
    }
  }

  get shadowOffsetY(): number {
    return this._context.shadowOffsetY;
  }

  set shadowOffsetY(value: number) {
    if (this._state.shadowOffsetY !== value) {
      this._state.shadowOffsetY = value;
      this._context.shadowOffsetY = value;
    }
  }

  get imageSmoothingEnabled(): boolean {
    return this._context.imageSmoothingEnabled;
  }

  set imageSmoothingEnabled(value: boolean) {
    if (this._state.imageSmoothingEnabled !== value) {
      this._state.imageSmoothingEnabled = value;
      this._context.imageSmoothingEnabled = value;
    }
  }

  get globalAlpha(): number {
    return this._context.globalAlpha;
  }

  set globalAlpha(value: number) {
    if (this._state.globalAlpha !== value) {
      this._state.globalAlpha = value;
      this._context.globalAlpha = value;
    }
  }

  get globalCompositeOperation(): GlobalCompositeOperation {
    return this._context.globalCompositeOperation;
  }

  set globalCompositeOperation(value: GlobalCompositeOperation) {
    if (this._state.globalCompositeOperation !== value) {
      this._state.globalCompositeOperation = value;
      this._context.globalCompositeOperation = value;
    }
  }

  getLineDash(): number[] {
    return this._context.getLineDash();
  }

  setLineDash(segments: number[]): void {
    this._context.setLineDash(segments);
  }

  rotate(angle: number): void {
    this._context.rotate(angle);
  }

  scale(x: number, y: number): void {
    this._context.scale(x, y);
  }

  transform(
    m11: number,
    m12: number,
    m21: number,
    m22: number,
    dx: number,
    dy: number
  ): void {
    this._context.transform(m11, m12, m21, m22, dx, dy);
  }

  translate(x: number, y: number): void {
    this._context.translate(x, y);
  }

  setTransform(
    m11: number,
    m12: number,
    m21: number,
    m22: number,
    dx: number,
    dy: number
  ): void {
    this._context.setTransform(m11, m12, m21, m22, dx, dy);
  }

  save(): void {
    // Clone an push the current state to the stack.
    this._state = Private.State.push(this._state);

    // Save the wrapped context state.
    this._context.save();
  }

  restore(): void {
    // Bail if there is no state to restore.
    if (!this._state.next) {
      return;
    }

    // Pop the saved state from the stack.
    this._state = Private.State.pop(this._state);

    // Restore the wrapped context state.
    this._context.restore();
  }

  beginPath(): void {
    return this._context.beginPath();
  }

  closePath(): void {
    this._context.closePath();
  }

  isPointInPath(x: number, y: number, fillRule?: CanvasFillRule): boolean {
    let result: boolean;
    if (arguments.length === 2) {
      result = this._context.isPointInPath(x, y);
    } else {
      result = this._context.isPointInPath(x, y, fillRule);
    }
    return result;
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
      this._context.arc(x, y, radius, startAngle, endAngle);
    } else {
      this._context.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    }
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this._context.arcTo(x1, y1, x2, y2, radius);
  }

  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    this._context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
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
      );
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
      );
    }
  }

  lineTo(x: number, y: number): void {
    this._context.lineTo(x, y);
  }

  moveTo(x: number, y: number): void {
    this._context.moveTo(x, y);
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this._context.quadraticCurveTo(cpx, cpy, x, y);
  }

  rect(x: number, y: number, w: number, h: number): void {
    this._context.rect(x, y, w, h);
  }

  clip(fillRule?: CanvasFillRule): void {
    if (arguments.length === 0) {
      this._context.clip();
    } else {
      this._context.clip(fillRule);
    }
  }

  fill(fillRule?: CanvasFillRule): void {
    if (arguments.length === 0) {
      this._context.fill();
    } else {
      this._context.fill(fillRule);
    }
  }

  stroke(): void {
    this._context.stroke();
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    return this._context.clearRect(x, y, w, h);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this._context.fillRect(x, y, w, h);
  }

  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    if (arguments.length === 3) {
      this._context.fillText(text, x, y);
    } else {
      this._context.fillText(text, x, y, maxWidth);
    }
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this._context.strokeRect(x, y, w, h);
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    if (arguments.length === 3) {
      this._context.strokeText(text, x, y);
    } else {
      this._context.strokeText(text, x, y, maxWidth);
    }
  }

  measureText(text: string): TextMetrics {
    return this._context.measureText(text);
  }

  createLinearGradient(
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): CanvasGradient {
    return this._context.createLinearGradient(x0, y0, x1, y1);
  }

  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number
  ): CanvasGradient {
    return this._context.createRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  createPattern(
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    repetition: string
  ): CanvasPattern | null {
    return this._context.createPattern(image, repetition);
  }

  createImageData(imageData: ImageData): ImageData;
  createImageData(sw: number, sh: number): ImageData;
  createImageData(): ImageData {
    // eslint-disable-next-line prefer-spread, prefer-rest-params
    return this._context.createImageData.apply(this._context, arguments);
  }

  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    return this._context.getImageData(sx, sy, sw, sh);
  }

  putImageData(imagedata: ImageData, dx: number, dy: number): void;
  putImageData(
    imagedata: ImageData,
    dx: number,
    dy: number,
    dirtyX: number,
    dirtyY: number,
    dirtyWidth: number,
    dirtyHeight: number
  ): void;
  putImageData(): void {
    // eslint-disable-next-line prefer-spread, prefer-rest-params
    this._context.putImageData.apply(this._context, arguments);
  }

  drawImage(
    image:
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement
      | ImageBitmap,
    dstX: number,
    dstY: number
  ): void;
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
  ): void;
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
  ): void;
  drawImage(): void {
    // eslint-disable-next-line prefer-spread, prefer-rest-params
    this._context.drawImage.apply(this._context, arguments);
  }

  drawFocusIfNeeded(element: Element): void {
    this._context.drawFocusIfNeeded(element);
  }

  private _disposed = false;
  private _state: Private.State;
  private _context: CanvasRenderingContext2D;
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The index of next valid pool object.
   */
  let pi = -1;

  /**
   * A state object allocation pool.
   */
  const pool: State[] = [];

  /**
   * An object which holds the state for a gc.
   */
  export class State {
    /**
     * Create a gc state object from a 2D canvas context.
     */
    static create(context: CanvasRenderingContext2D): State {
      let state = pi < 0 ? new State() : pool[pi--];
      state.next = null;
      state.fillStyle = context.fillStyle;
      state.font = context.font;
      state.globalAlpha = context.globalAlpha;
      state.globalCompositeOperation = context.globalCompositeOperation;
      state.imageSmoothingEnabled = context.imageSmoothingEnabled;
      state.lineCap = context.lineCap;
      state.lineDashOffset = context.lineDashOffset;
      state.lineJoin = context.lineJoin;
      state.lineWidth = context.lineWidth;
      state.miterLimit = context.miterLimit;
      state.shadowBlur = context.shadowBlur;
      state.shadowColor = context.shadowColor;
      state.shadowOffsetX = context.shadowOffsetX;
      state.shadowOffsetY = context.shadowOffsetY;
      state.strokeStyle = context.strokeStyle;
      state.textAlign = context.textAlign;
      state.textBaseline = context.textBaseline;
      return state;
    }

    /**
     * Clone an existing gc state object and add it to the state stack.
     */
    static push(other: State): State {
      let state = pi < 0 ? new State() : pool[pi--];
      state.next = other;
      state.fillStyle = other.fillStyle;
      state.font = other.font;
      state.globalAlpha = other.globalAlpha;
      state.globalCompositeOperation = other.globalCompositeOperation;
      state.imageSmoothingEnabled = other.imageSmoothingEnabled;
      state.lineCap = other.lineCap;
      state.lineDashOffset = other.lineDashOffset;
      state.lineJoin = other.lineJoin;
      state.lineWidth = other.lineWidth;
      state.miterLimit = other.miterLimit;
      state.shadowBlur = other.shadowBlur;
      state.shadowColor = other.shadowColor;
      state.shadowOffsetX = other.shadowOffsetX;
      state.shadowOffsetY = other.shadowOffsetY;
      state.strokeStyle = other.strokeStyle;
      state.textAlign = other.textAlign;
      state.textBaseline = other.textBaseline;
      return state;
    }

    /**
     * Pop the next state object and return the current to the pool
     */
    static pop(state: State): State {
      state.fillStyle = '';
      state.strokeStyle = '';
      pool[++pi] = state;
      return state.next!;
    }

    next: State | null;

    fillStyle: string | CanvasGradient | CanvasPattern;
    font: string;
    globalAlpha: number;
    globalCompositeOperation: string;
    imageSmoothingEnabled: boolean;
    lineCap: string;
    lineDashOffset: number;
    lineJoin: string;
    lineWidth: number;
    miterLimit: number;
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    textAlign: string;
    textBaseline: string;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { CellRenderer } from './cellrenderer';

import { GraphicsContext } from './graphicscontext';

import { TextRenderer } from './textrenderer';

/**
 * A cell renderer which renders data values as text.
 */
export class HyperlinkRenderer extends TextRenderer {
  /**
   * Construct a new text renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: HyperlinkRenderer.IOptions = {}) {
    // Set default parameters before passing over the super.
    options.textColor = options.textColor || 'navy';
    options.font = options.font || 'bold 12px sans-serif';
    super(options);
    this.url = options.url;
    this.urlName = options.urlName;
  }

  /**
   * The URL address.
   */
  readonly url: CellRenderer.ConfigOption<string> | undefined;

  /**
   * The friendly link name.
   */
  readonly urlName: CellRenderer.ConfigOption<string> | undefined;

  /**
   * Draw the text for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawText(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    // Resolve the font for the cell.
    let font = CellRenderer.resolveOption(this.font, config);

    // Bail if there is no font to draw.
    if (!font) {
      return;
    }

    // Resolve for the friendly URL name.
    let urlName = CellRenderer.resolveOption(this.urlName, config);

    // Resolve the text color for the cell.
    let color = CellRenderer.resolveOption(this.textColor, config);

    // Bail if there is no text color to draw.
    if (!color) {
      return;
    }

    const format = this.format;
    let text;

    // If we have a friendly URL name, use that.
    if (urlName) {
      text = format({
        ...config,
        value: urlName
      } as CellRenderer.CellConfig);
    } else {
      // Otherwise use the raw value attribute.
      text = format(config);
    }

    // Bail if there is no text to draw.
    if (!text) {
      return;
    }

    // Resolve the vertical and horizontal alignment.
    let vAlign = CellRenderer.resolveOption(this.verticalAlignment, config);
    let hAlign = CellRenderer.resolveOption(this.horizontalAlignment, config);

    // Resolve the elision direction
    let elideDirection = CellRenderer.resolveOption(
      this.elideDirection,
      config
    );

    // Resolve the text wrapping flag
    let wrapText = CellRenderer.resolveOption(this.wrapText, config);

    // Compute the padded text box height for the specified alignment.
    let boxHeight = config.height - (vAlign === 'center' ? 1 : 2);

    // Bail if the text box has no effective size.
    if (boxHeight <= 0) {
      return;
    }

    // Compute the text height for the gc font.
    let textHeight = HyperlinkRenderer.measureFontHeight(font);

    // Set up the text position variables.
    let textX: number;
    let textY: number;
    let boxWidth: number;

    // Compute the Y position for the text.
    switch (vAlign) {
      case 'top':
        textY = config.y + 2 + textHeight;
        break;
      case 'center':
        textY = config.y + config.height / 2 + textHeight / 2;
        break;
      case 'bottom':
        textY = config.y + config.height - 2;
        break;
      default:
        throw 'unreachable';
    }

    // Compute the X position for the text.
    switch (hAlign) {
      case 'left':
        textX = config.x + 8;
        boxWidth = config.width - 14;
        break;
      case 'center':
        textX = config.x + config.width / 2;
        boxWidth = config.width;
        break;
      case 'right':
        textX = config.x + config.width - 8;
        boxWidth = config.width - 14;
        break;
      default:
        throw 'unreachable';
    }

    // Clip the cell if the text is taller than the text box height.
    if (textHeight > boxHeight) {
      gc.beginPath();
      gc.rect(config.x, config.y, config.width, config.height - 1);
      gc.clip();
    }

    // Set the gc state.
    gc.font = font;
    gc.fillStyle = color;
    gc.textAlign = hAlign;
    gc.textBaseline = 'bottom';

    // The current text width in pixels.
    let textWidth = gc.measureText(text).width;

    // Apply text wrapping if enabled.
    if (wrapText && textWidth > boxWidth) {
      // Make sure box clipping happens.
      gc.beginPath();
      gc.rect(config.x, config.y, config.width, config.height - 1);
      gc.clip();

      // Split column name to words based on
      // whitespace preceding a word boundary.
      // "Hello  world" --> ["Hello  ", "world"]
      const wordsInColumn = text.split(/\s(?=\b)/);

      // Y-coordinate offset for any additional lines
      let curY = textY;
      let textInCurrentLine = wordsInColumn.shift()!;

      // Single word. Applying text wrap on word by splitting
      // it into characters and fitting the maximum number of
      // characters possible per line (box width).
      if (wordsInColumn.length === 0) {
        let curLineTextWidth = gc.measureText(textInCurrentLine).width;
        while (curLineTextWidth > boxWidth && textInCurrentLine !== '') {
          // Iterating from the end of the string until we find a
          // substring (0,i) which has a width less than the box width.
          for (let i = textInCurrentLine.length; i > 0; i--) {
            const curSubString = textInCurrentLine.substring(0, i);
            const curSubStringWidth = gc.measureText(curSubString).width;
            if (curSubStringWidth < boxWidth || curSubString.length === 1) {
              // Found a substring which has a width less than the current
              // box width. Rendering that substring on the current line
              // and setting the remainder of the parent string as the next
              // string to iterate on for the next line.
              const nextLineText = textInCurrentLine.substring(
                i,
                textInCurrentLine.length
              );
              textInCurrentLine = nextLineText;
              curLineTextWidth = gc.measureText(textInCurrentLine).width;
              gc.fillText(curSubString, textX, curY);
              curY += textHeight;
              // No need to continue iterating after we identified
              // an index to break the string on.
              break;
            }
          }
        }
      }

      // Multiple words in column header. Fitting maximum
      // number of words possible per line (box width).
      else {
        while (wordsInColumn.length !== 0) {
          // Processing the next word in the queue.
          const curWord = wordsInColumn.shift();
          // Joining that word with the existing text for
          // the current line.
          const incrementedText = [textInCurrentLine, curWord].join(' ');
          const incrementedTextWidth = gc.measureText(incrementedText).width;
          if (incrementedTextWidth > boxWidth) {
            // If the newly combined text has a width larger than
            // the box width, we render the line before the current
            // word was added. We set the current word as the next
            // line.
            gc.fillText(textInCurrentLine, textX, curY);
            curY += textHeight;
            textInCurrentLine = curWord!;
          } else {
            // The combined text hasd a width less than the box width. We
            // set the the current line text to be the new combined text.
            textInCurrentLine = incrementedText;
          }
        }
      }
      gc.fillText(textInCurrentLine!, textX, curY);
      // Terminating the call here as we don't want
      // to apply text eliding when wrapping is active.
      return;
    }

    // Elide text that is too long
    let elide = '\u2026';

    // Compute elided text
    if (elideDirection === 'right') {
      while (textWidth > boxWidth && text.length > 1) {
        if (text.length > 4 && textWidth >= 2 * boxWidth) {
          // If text width is substantially bigger, take half the string
          text = text.substring(0, text.length / 2 + 1) + elide;
        } else {
          // Otherwise incrementally remove the last character
          text = text.substring(0, text.length - 2) + elide;
        }
        textWidth = gc.measureText(text).width;
      }
    } else {
      while (textWidth > boxWidth && text.length > 1) {
        if (text.length > 4 && textWidth >= 2 * boxWidth) {
          // If text width is substantially bigger, take half the string
          text = elide + text.substring(text.length / 2);
        } else {
          // Otherwise incrementally remove the last character
          text = elide + text.substring(2);
        }
        textWidth = gc.measureText(text).width;
      }
    }

    // Draw the text for the cell.
    gc.fillText(text, textX, textY);
  }
}

export namespace HyperlinkRenderer {
  /**
   * A type alias for the supported vertical alignment modes.
   */
  export type VerticalAlignment = 'top' | 'center' | 'bottom';

  /**
   * A type alias for the supported horizontal alignment modes.
   */
  export type HorizontalAlignment = 'left' | 'center' | 'right';

  /**
   * A type alias for the supported ellipsis sides.
   */
  export type ElideDirection = 'left' | 'right';

  /**
   * An options object for initializing a text renderer.
   */
  export interface IOptions extends TextRenderer.IOptions {
    /**
     * The URL address
     */
    url?: CellRenderer.ConfigOption<string> | undefined;
    /**
     * The friendly link name.
     *
     * The default is the URL itself.
     */
    urlName?: CellRenderer.ConfigOption<string> | undefined;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
export * from './basickeyhandler';
export * from './basicmousehandler';
export * from './basicselectionmodel';
export * from './cellrenderer';
export * from './celleditor';
export * from './celleditorcontroller';
export * from './datagrid';
export * from './datamodel';
export * from './graphicscontext';
export * from './jsonmodel';
export * from './renderermap';
export * from './selectionmodel';
export * from './sectionlist';
export * from './textrenderer';
export * from './hyperlinkrenderer';
export * from './cellgroup';
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ReadonlyJSONObject } from '@lumino/coreutils';

import { DataModel } from './datamodel';

/**
 * A data model implementation for in-memory JSON data.
 */
export class JSONModel extends DataModel {
  /**
   * Create a data model with static JSON data.
   *
   * @param options - The options for initializing the data model.
   */
  constructor(options: JSONModel.IOptions) {
    super();
    let split = Private.splitFields(options.schema);
    this._data = options.data;
    this._bodyFields = split.bodyFields;
    this._headerFields = split.headerFields;
    this._missingValues = Private.createMissingMap(options.schema);
  }

  /**
   * Get the row count for a region in the data model.
   *
   * @param region - The row region of interest.
   *
   * @returns - The row count for the region.
   */
  rowCount(region: DataModel.RowRegion): number {
    if (region === 'body') {
      return this._data.length;
    }
    return 1; // TODO multiple column-header rows?
  }

  /**
   * Get the column count for a region in the data model.
   *
   * @param region - The column region of interest.
   *
   * @returns - The column count for the region.
   */
  columnCount(region: DataModel.ColumnRegion): number {
    if (region === 'body') {
      return this._bodyFields.length;
    }
    return this._headerFields.length;
  }

  /**
   * Get the data value for a cell in the data model.
   *
   * @param region - The cell region of interest.
   *
   * @param row - The row index of the cell of interest.
   *
   * @param column - The column index of the cell of interest.
   *
   * @returns - The data value for the specified cell.
   *
   * #### Notes
   * A `missingValue` as defined by the schema is converted to `null`.
   */
  data(region: DataModel.CellRegion, row: number, column: number): any {
    // Set up the field and value variables.
    let field: JSONModel.Field;
    let value: any;

    // Look up the field and value for the region.
    switch (region) {
      case 'body':
        field = this._bodyFields[column];
        value = this._data[row][field.name];
        break;
      case 'column-header':
        field = this._bodyFields[column];
        value = field.title || field.name;
        break;
      case 'row-header':
        field = this._headerFields[column];
        value = this._data[row][field.name];
        break;
      case 'corner-header':
        field = this._headerFields[column];
        value = field.title || field.name;
        break;
      default:
        throw 'unreachable';
    }

    // Test whether the value is a missing value.
    let missing =
      this._missingValues !== null &&
      typeof value === 'string' &&
      this._missingValues[value] === true;

    // Return the final value.
    return missing ? null : value;
  }

  /**
   * Get the metadata for a cell in the data model.
   *
   * @param region - The cell region of interest.
   *
   * @param row - The row index of the cell of of interest.
   *
   * @param column - The column index of the cell of interest.
   *
   * @returns The metadata for the cell.
   */
  metadata(
    region: DataModel.CellRegion,
    row: number,
    column: number
  ): DataModel.Metadata {
    if (region === 'body' || region === 'column-header') {
      return this._bodyFields[column];
    }
    return this._headerFields[column];
  }

  private _data: JSONModel.DataSource;
  private _bodyFields: JSONModel.Field[];
  private _headerFields: JSONModel.Field[];
  private _missingValues: Private.MissingValuesMap | null;
}

/**
 * The namespace for the `JSONModel` class statics.
 */
export namespace JSONModel {
  /**
   * An object which describes a column of data in the model.
   *
   * #### Notes
   * This is based on the JSON Table Schema specification:
   * https://specs.frictionlessdata.io/table-schema/
   */
  export type Field = {
    /**
     * The name of the column.
     *
     * This is used as the key to extract a value from a data record.
     * It is also used as the column header label, unless the `title`
     * property is provided.
     */
    readonly name: string;

    /**
     * The type of data held in the column.
     */
    readonly type?: string;

    /**
     * The format of the data in the column.
     */
    readonly format?: string;

    /**
     * The human readable name for the column.
     *
     * This is used as the label for the column header.
     */
    readonly title?: string;

    // TODO want/need support for any these?
    // description?: string;
    // constraints?: IConstraints;
    // rdfType?: string;
  };

  /**
   * An object when specifies the schema for a data model.
   *
   * #### Notes
   * This is based on the JSON Table Schema specification:
   * https://specs.frictionlessdata.io/table-schema/
   */
  export type Schema = {
    /**
     * The fields which describe the data model columns.
     *
     * Primary key fields are rendered as row header columns.
     */
    readonly fields: Field[];

    /**
     * The values to treat as "missing" data.
     *
     * Missing values are automatically converted to `null`.
     */
    readonly missingValues?: string[];

    /**
     * The field names which act as primary keys.
     *
     * Primary key fields are rendered as row header columns.
     */
    readonly primaryKey?: string | string[];

    // TODO want/need support for this?
    // foreignKeys?: IForeignKey[];
  };

  /**
   * A type alias for a data source for a JSON data model.
   *
   * A data source is an array of JSON object records which represent
   * the rows of the table. The keys of the records correspond to the
   * field names of the columns.
   */
  export type DataSource = ReadonlyArray<ReadonlyJSONObject>;

  /**
   * An options object for initializing a JSON data model.
   */
  export interface IOptions {
    /**
     * The schema for the for the data model.
     *
     * The schema should be treated as an immutable object.
     */
    schema: Schema;

    /**
     * The data source for the data model.
     *
     * The data model takes full ownership of the data source.
     */
    data: DataSource;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which holds the results of splitting schema fields.
   */
  export type SplitFieldsResult = {
    /**
     * The non-primary key fields to use for the grid body.
     */
    bodyFields: JSONModel.Field[];

    /**
     * The primary key fields to use for the grid headers.
     */
    headerFields: JSONModel.Field[];
  };

  /**
   * Split the schema fields into header and body fields.
   */
  export function splitFields(schema: JSONModel.Schema): SplitFieldsResult {
    // Normalize the primary keys.
    let primaryKeys: string[];
    if (schema.primaryKey === undefined) {
      primaryKeys = [];
    } else if (typeof schema.primaryKey === 'string') {
      primaryKeys = [schema.primaryKey];
    } else {
      primaryKeys = schema.primaryKey;
    }

    // Separate the fields for the body and header.
    let bodyFields: JSONModel.Field[] = [];
    let headerFields: JSONModel.Field[] = [];
    for (let field of schema.fields) {
      if (primaryKeys.indexOf(field.name) === -1) {
        bodyFields.push(field);
      } else {
        headerFields.push(field);
      }
    }

    // Return the separated fields.
    return { bodyFields, headerFields };
  }

  /**
   * A type alias for a missing value map.
   */
  export type MissingValuesMap = { [key: string]: boolean };

  /**
   * Create a missing values map for a schema.
   *
   * This returns `null` if there are no missing values.
   */
  export function createMissingMap(
    schema: JSONModel.Schema
  ): MissingValuesMap | null {
    // Bail early if there are no missing values.
    if (!schema.missingValues || schema.missingValues.length === 0) {
      return null;
    }

    // Collect the missing values into a map.
    let result: MissingValuesMap = Object.create(null);
    for (let value of schema.missingValues) {
      result[value] = true;
    }

    // Return the populated map.
    return result;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import { Message } from '@lumino/messaging';

import { Widget } from '@lumino/widgets';

/**
 * A widget which implements a notification popup.
 */
export class Notification extends Widget {
  /**
   * Construct a new notification.
   *
   * @param options - The options for initializing the notification.
   */
  constructor(options: Notification.IOptions) {
    super({ node: Private.createNode() });
    this.addClass('lm-DataGrid-notification');
    this.setFlag(Widget.Flag.DisallowLayout);

    this._target = options.target;
    this._message = options.message || '';
    this._placement = options.placement || 'bottom';

    Widget.attach(this, document.body);

    if (options.timeout && options.timeout > 0) {
      setTimeout(() => {
        this.close();
      }, options.timeout);
    }
  }

  /**
   * Handle the DOM events for the notification.
   *
   * @param event - The DOM event sent to the notification.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the notification's DOM node.
   *
   * This should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'mousedown':
        this._evtMouseDown(event as MouseEvent);
        break;
      case 'contextmenu':
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }

  /**
   * Get the placement of the notification.
   */
  get placement(): Notification.Placement {
    return this._placement;
  }

  /**
   * Set the placement of the notification.
   */
  set placement(value: Notification.Placement) {
    // Do nothing if the placement does not change.
    if (this._placement === value) {
      return;
    }

    // Update the internal placement.
    this._placement = value;

    // Schedule an update for notification.
    this.update();
  }

  /**
   * Get the current value of the message.
   */
  get message(): string {
    return this._message;
  }

  /**
   * Set the current value of the message.
   *
   */
  set message(value: string) {
    // Do nothing if the value does not change.
    if (this._message === value) {
      return;
    }

    // Update the internal value.
    this._message = value;

    // Schedule an update for notification.
    this.update();
  }

  /**
   * Get the node presenting the message.
   */
  get messageNode(): HTMLSpanElement {
    return this.node.getElementsByClassName(
      'lm-DataGrid-notificationMessage'
    )[0] as HTMLSpanElement;
  }

  /**
   * A method invoked on a 'before-attach' message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('mousedown', this);
    this.update();
  }

  /**
   * A method invoked on an 'after-detach' message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('mousedown', this);
  }

  /**
   * A method invoked on an 'update-request' message.
   */
  protected onUpdateRequest(msg: Message): void {
    const targetRect = this._target.getBoundingClientRect();
    const style = this.node.style;

    switch (this._placement) {
      case 'bottom':
        style.left = targetRect.left + 'px';
        style.top = targetRect.bottom + 'px';
        break;
      case 'top':
        style.left = targetRect.left + 'px';
        style.height = targetRect.top + 'px';
        style.top = '0';
        style.alignItems = 'flex-end';
        style.justifyContent = 'flex-end';
        break;
      case 'left':
        style.left = '0';
        style.width = targetRect.left + 'px';
        style.top = targetRect.top + 'px';
        style.alignItems = 'flex-end';
        style.justifyContent = 'flex-end';
        break;
      case 'right':
        style.left = targetRect.right + 'px';
        style.top = targetRect.top + 'px';
        break;
    }

    this.messageNode.innerHTML = this._message;
  }

  /**
   * Handle the `'mousedown'` event for the notification.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  private _target: HTMLElement;
  private _message: string = '';
  private _placement: Notification.Placement;
}

/**
 * The namespace for the `Notification` class statics.
 */
export namespace Notification {
  /**
   * A type alias for a notification placement.
   */
  export type Placement = 'top' | 'bottom' | 'left' | 'right';

  /**
   * An options object for creating a notification.
   */
  export interface IOptions {
    /**
     * Target element to attach notification to.
     *
     */
    target: HTMLElement;

    /**
     * The message to show on notification.
     */
    message?: string;

    /**
     * The placement of the notification.
     *
     * The default is `'bottom'`.
     */
    placement?: Placement;

    /**
     * Duration in ms after which to close notification popup.
     *
     * The default is undefined, and notification is kept visible
     * Timeout value needs to be greater than zero
     */
    timeout?: number;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create the DOM node for notification.
   */
  export function createNode(): HTMLElement {
    const node = document.createElement('div');
    const container = document.createElement('div');
    container.className = 'lm-DataGrid-notificationContainer';
    const message = document.createElement('span');
    message.className = 'lm-DataGrid-notificationMessage';
    container.appendChild(message);
    node.appendChild(container);

    return node;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ISignal, Signal } from '@lumino/signaling';

import { CellRenderer } from './cellrenderer';

import { DataModel } from './datamodel';

import { TextRenderer } from './textrenderer';

/**
 * A class which manages the mapping of cell renderers.
 */
export class RendererMap {
  /**
   * Construct a new renderer map.
   *
   * @param values - The initial values for the map.
   *
   * @param fallback - The renderer of last resort.
   */
  constructor(values: RendererMap.Values = {}, fallback?: CellRenderer) {
    this._values = { ...values };
    this._fallback = fallback || new TextRenderer();
  }

  /**
   * A signal emitted when the renderer map has changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * Get the cell renderer to use for the given cell config.
   *
   * @param config - The cell config of interest.
   *
   * @returns The renderer to use for the cell.
   */
  get(config: CellRenderer.CellConfig): CellRenderer {
    // Fetch the renderer from the values map.
    let renderer = this._values[config.region];

    // Execute a resolver function if necessary.
    if (typeof renderer === 'function') {
      try {
        renderer = renderer(config);
      } catch (err) {
        renderer = undefined;
        console.error(err);
      }
    }

    // Return the renderer or the fallback.
    return renderer || this._fallback;
  }

  /**
   * Update the renderer map with new values
   *
   * @param values - The updated values for the map.
   *
   * @param fallback - The renderer of last resort.
   *
   * #### Notes
   * This method always emits the `changed` signal.
   */
  update(values: RendererMap.Values = {}, fallback?: CellRenderer): void {
    this._values = { ...this._values, ...values };
    this._fallback = fallback || this._fallback;
    this._changed.emit(undefined);
  }

  private _fallback: CellRenderer;
  private _values: RendererMap.Values;
  private _changed = new Signal<this, void>(this);
}

/**
 * The namespace for the `RendererMap` class statics.
 */
export namespace RendererMap {
  /**
   * A type alias for a cell renderer resolver function.
   */
  export type Resolver = CellRenderer.ConfigFunc<CellRenderer | undefined>;

  /**
   * A type alias for a `RendererMap` values type.
   */
  export type Values = {
    [R in DataModel.CellRegion]?: Resolver | CellRenderer | undefined;
  };
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

/**
 * An object which manages a collection of variable sized sections.
 *
 * #### Notes
 * This class is an implementation detail. It is designed to manage
 * the variable row and column sizes for a data grid. User code will
 * not interact with this class directly.
 */
export class SectionList {
  /**
   * Construct a new section list.
   *
   * @param options - The options for initializing the list.
   */
  constructor(options: SectionList.IOptions) {
    this._minimumSize = options.minimumSize || 2;
    this._defaultSize = Math.max(
      this._minimumSize,
      Math.floor(options.defaultSize)
    );
  }

  /**
   * The total size of all sections in the list.
   *
   * #### Complexity
   * Constant.
   */
  get length(): number {
    return this._length;
  }

  /**
   * The total number of sections in the list.
   *
   * #### Complexity
   * Constant.
   */
  get count(): number {
    return this._count;
  }

  /**
   * Get the minimum size of sections in the list.
   *
   * #### Complexity
   * Constant.
   */
  get minimumSize(): number {
    return this._minimumSize;
  }

  /**
   * Set the minimum size of sections in the list.
   *
   * #### Complexity
   * Linear on the number of resized sections.
   */
  set minimumSize(value: number) {
    // Normalize the value.
    value = Math.max(2, Math.floor(value));

    // Bail early if the value does not change.
    if (this._minimumSize === value) {
      return;
    }

    // Update the internal minimum size.
    this._minimumSize = value;

    // Update default size if larger than minimum size
    if (value > this._defaultSize) {
      this.defaultSize = value;
    }
  }

  /**
   * Get the default size of sections in the list.
   *
   * #### Complexity
   * Constant.
   */
  get defaultSize(): number {
    return this._defaultSize;
  }

  /**
   * Set the default size of sections in the list.
   *
   * #### Complexity
   * Linear on the number of resized sections.
   */
  set defaultSize(value: number) {
    // Normalize the value.
    value = Math.max(this._minimumSize, Math.floor(value));

    // Bail early if the value does not change.
    if (this._defaultSize === value) {
      return;
    }

    // Compute the delta default size.
    let delta = value - this._defaultSize;

    // Update the internal default size.
    this._defaultSize = value;

    // Update the length.
    this._length += delta * (this._count - this._sections.length);

    // Bail early if there are no modified sections.
    if (this._sections.length === 0) {
      return;
    }

    // Recompute the offsets of the modified sections.
    for (let i = 0, n = this._sections.length; i < n; ++i) {
      // Look up the previous and current modified sections.
      let prev = this._sections[i - 1];
      let curr = this._sections[i];

      // Adjust the offset for the current section.
      if (prev) {
        let count = curr.index - prev.index - 1;
        curr.offset = prev.offset + prev.size + count * value;
      } else {
        curr.offset = curr.index * value;
      }
    }
  }

  /**
   * Clamp a size to the minimum section size
   *
   * @param size - The size to clamp.
   *
   * @returns The size or the section minimum size, whichever is larger
   */
  clampSize(size: number): number {
    return Math.max(this._minimumSize, Math.floor(size));
  }

  /**
   * Find the index of the section which covers the given offset.
   *
   * @param offset - The offset of the section of interest.
   *
   * @returns The index of the section which covers the given offset,
   *   or `-1` if the offset is out of range.
   *
   * #### Complexity
   * Logarithmic on the number of resized sections.
   */
  indexOf(offset: number): number {
    // Bail early if the offset is out of range.
    if (offset < 0 || offset >= this._length || this._count === 0) {
      return -1;
    }

    // Handle the simple case of no modified sections.
    if (this._sections.length === 0) {
      return Math.floor(offset / this._defaultSize);
    }

    // Find the modified section for the given offset.
    let i = ArrayExt.lowerBound(this._sections, offset, Private.offsetCmp);

    // Return the index of an exact match.
    if (i < this._sections.length && this._sections[i].offset <= offset) {
      return this._sections[i].index;
    }

    // Handle the case of no modified sections before the offset.
    if (i === 0) {
      return Math.floor(offset / this._defaultSize);
    }

    // Compute the index from the previous modified section.
    let section = this._sections[i - 1];
    let span = offset - (section.offset + section.size);
    return section.index + Math.floor(span / this._defaultSize) + 1;
  }

  /**
   * Find the offset of the section at the given index.
   *
   * @param index - The index of the section of interest.
   *
   * @returns The offset of the section at the given index, or `-1`
   *   if the index is out of range.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   *
   * #### Complexity
   * Logarithmic on the number of resized sections.
   */
  offsetOf(index: number): number {
    // Bail early if the index is out of range.
    if (index < 0 || index >= this._count) {
      return -1;
    }

    // Handle the simple case of no modified sections.
    if (this._sections.length === 0) {
      return index * this._defaultSize;
    }

    // Find the modified section for the given index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Return the offset of an exact match.
    if (i < this._sections.length && this._sections[i].index === index) {
      return this._sections[i].offset;
    }

    // Handle the case of no modified sections before the index.
    if (i === 0) {
      return index * this._defaultSize;
    }

    // Compute the offset from the previous modified section.
    let section = this._sections[i - 1];
    let span = index - section.index - 1;
    return section.offset + section.size + span * this._defaultSize;
  }

  /**
   * Find the extent of the section at the given index.
   *
   * @param index - The index of the section of interest.
   *
   * @returns The extent of the section at the given index, or `-1`
   *   if the index is out of range.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   *
   * #### Complexity
   * Logarithmic on the number of resized sections.
   */
  extentOf(index: number): number {
    // Bail early if the index is out of range.
    if (index < 0 || index >= this._count) {
      return -1;
    }

    // Handle the simple case of no modified sections.
    if (this._sections.length === 0) {
      return (index + 1) * this._defaultSize - 1;
    }

    // Find the modified section for the given index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Return the offset of an exact match.
    if (i < this._sections.length && this._sections[i].index === index) {
      return this._sections[i].offset + this._sections[i].size - 1;
    }

    // Handle the case of no modified sections before the index.
    if (i === 0) {
      return (index + 1) * this._defaultSize - 1;
    }

    // Compute the offset from the previous modified section.
    let section = this._sections[i - 1];
    let span = index - section.index;
    return section.offset + section.size + span * this._defaultSize - 1;
  }

  /**
   * Find the size of the section at the given index.
   *
   * @param index - The index of the section of interest.
   *
   * @returns The size of the section at the given index, or `-1`
   *   if the index is out of range.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   *
   * #### Complexity
   * Logarithmic on the number of resized sections.
   */
  sizeOf(index: number): number {
    // Bail early if the index is out of range.
    if (index < 0 || index >= this._count) {
      return -1;
    }

    // Handle the simple case of no modified sections.
    if (this._sections.length === 0) {
      return this._defaultSize;
    }

    // Find the modified section for the given index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Return the size of an exact match.
    if (i < this._sections.length && this._sections[i].index === index) {
      return this._sections[i].size;
    }

    // Return the default size for all other cases.
    return this._defaultSize;
  }

  /**
   * Resize a section in the list.
   *
   * @param index - The index of the section to resize. This method
   *   is a no-op if this value is out of range.
   *
   * @param size - The new size of the section. This value will be
   *   clamped to an integer `>= 0`.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   *
   * #### Complexity
   * Linear on the number of resized sections.
   */
  resize(index: number, size: number): void {
    // Bail early if the index is out of range.
    if (index < 0 || index >= this._count) {
      return;
    }

    // Clamp the size to an integer >= minimum size.
    size = Math.max(this._minimumSize, Math.floor(size));

    // Find the modified section for the given index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Update or create the modified section as needed.
    let delta: number;
    if (i < this._sections.length && this._sections[i].index === index) {
      let section = this._sections[i];
      delta = size - section.size;
      section.size = size;
    } else if (i === 0) {
      let offset = index * this._defaultSize;
      ArrayExt.insert(this._sections, i, { index, offset, size });
      delta = size - this._defaultSize;
    } else {
      let section = this._sections[i - 1];
      let span = index - section.index - 1;
      let offset = section.offset + section.size + span * this._defaultSize;
      ArrayExt.insert(this._sections, i, { index, offset, size });
      delta = size - this._defaultSize;
    }

    // Adjust the length.
    this._length += delta;

    // Update all modified sections after the resized section.
    for (let j = i + 1, n = this._sections.length; j < n; ++j) {
      this._sections[j].offset += delta;
    }
  }

  /**
   * Insert sections into the list.
   *
   * @param index - The index at which to insert the sections. This
   *   value will be clamped to the bounds of the list.
   *
   * @param count - The number of sections to insert. This method
   *   is a no-op if this value is `<= 0`.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   *
   * #### Complexity
   * Linear on the number of resized sections.
   */
  insert(index: number, count: number): void {
    // Bail early if there are no sections to insert.
    if (count <= 0) {
      return;
    }

    // Clamp the index to the bounds of the list.
    index = Math.max(0, Math.min(index, this._count));

    // Add the new sections to the totals.
    let span = count * this._defaultSize;
    this._count += count;
    this._length += span;

    // Bail early if there are no modified sections to update.
    if (this._sections.length === 0) {
      return;
    }

    // Find the modified section for the given index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Update all modified sections after the insert location.
    for (let n = this._sections.length; i < n; ++i) {
      let section = this._sections[i];
      section.index += count;
      section.offset += span;
    }
  }

  /**
   * Remove sections from the list.
   *
   * @param index - The index of the first section to remove. This
   *   method is a no-op if this value is out of range.
   *
   * @param count - The number of sections to remove. This method
   *   is a no-op if this value is `<= 0`.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   *
   * #### Complexity
   * Linear on the number of resized sections.
   */
  remove(index: number, count: number): void {
    // Bail early if there is nothing to remove.
    if (index < 0 || index >= this._count || count <= 0) {
      return;
    }

    // Clamp the count to the bounds of the list.
    count = Math.min(this._count - index, count);

    // Handle the simple case of no modified sections to update.
    if (this._sections.length === 0) {
      this._count -= count;
      this._length -= count * this._defaultSize;
      return;
    }

    // Handle the simple case of removing all sections.
    if (count === this._count) {
      this._length = 0;
      this._count = 0;
      this._sections.length = 0;
      return;
    }

    // Find the modified section for the start index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Find the modified section for the end index.
    let j = ArrayExt.lowerBound(
      this._sections,
      index + count,
      Private.indexCmp
    );

    // Remove the relevant modified sections.
    let removed = this._sections.splice(i, j - i);

    // Compute the total removed span.
    let span = (count - removed.length) * this._defaultSize;
    for (let k = 0, n = removed.length; k < n; ++k) {
      span += removed[k].size;
    }

    // Adjust the totals.
    this._count -= count;
    this._length -= span;

    // Update all modified sections after the removed span.
    for (let k = i, n = this._sections.length; k < n; ++k) {
      let section = this._sections[k];
      section.index -= count;
      section.offset -= span;
    }
  }

  /**
   * Move sections within the list.
   *
   * @param index - The index of the first section to move. This method
   *   is a no-op if this value is out of range.
   *
   * @param count - The number of sections to move. This method is a
   *   no-op if this value is `<= 0`.
   *
   * @param destination - The destination index for the first section.
   *   This value will be clamped to the allowable range.
   *
   * #### Undefined Behavior
   * An `index`, `count`, or `destination` which is non-integral.
   *
   * #### Complexity
   * Linear on the number of moved resized sections.
   */
  move(index: number, count: number, destination: number): void {
    // Bail early if there is nothing to move.
    if (index < 0 || index >= this._count || count <= 0) {
      return;
    }

    // Handle the simple case of no modified sections.
    if (this._sections.length === 0) {
      return;
    }

    // Clamp the move count to the limit.
    count = Math.min(count, this._count - index);

    // Clamp the destination index to the limit.
    destination = Math.min(Math.max(0, destination), this._count - count);

    // Bail early if there is no effective move.
    if (index === destination) {
      return;
    }

    // Compute the first affected index.
    let i1 = Math.min(index, destination);

    // Look up the first affected modified section.
    let k1 = ArrayExt.lowerBound(this._sections, i1, Private.indexCmp);

    // Bail early if there are no affected modified sections.
    if (k1 === this._sections.length) {
      return;
    }

    // Compute the last affected index.
    let i2 = Math.max(index + count - 1, destination + count - 1);

    // Look up the last affected modified section.
    let k2 = ArrayExt.upperBound(this._sections, i2, Private.indexCmp) - 1;

    // Bail early if there are no affected modified sections.
    if (k2 < k1) {
      return;
    }

    // Compute the pivot index.
    let pivot = destination < index ? index : index + count;

    // Compute the count for each side of the pivot.
    let count1 = pivot - i1;
    let count2 = i2 - pivot + 1;

    // Compute the span for each side of the pivot.
    let span1 = count1 * this._defaultSize;
    let span2 = count2 * this._defaultSize;

    // Adjust the spans for the modified sections.
    for (let j = k1; j <= k2; ++j) {
      let section = this._sections[j];
      if (section.index < pivot) {
        span1 += section.size - this._defaultSize;
      } else {
        span2 += section.size - this._defaultSize;
      }
    }

    // Look up the pivot section.
    let k3 = ArrayExt.lowerBound(this._sections, pivot, Private.indexCmp);

    // Rotate the modified sections if needed.
    if (k1 <= k3 && k3 <= k2) {
      ArrayExt.rotate(this._sections, k3 - k1, k1, k2);
    }

    // Adjust the modified section indices and offsets.
    for (let j = k1; j <= k2; ++j) {
      let section = this._sections[j];
      if (section.index < pivot) {
        section.index += count2;
        section.offset += span2;
      } else {
        section.index -= count1;
        section.offset -= span1;
      }
    }
  }

  /**
   * Reset all modified sections to the default size.
   *
   * #### Complexity
   * Constant.
   */
  reset(): void {
    this._sections.length = 0;
    this._length = this._count * this._defaultSize;
  }

  /**
   * Remove all sections from the list.
   *
   * #### Complexity
   * Constant.
   */
  clear(): void {
    this._count = 0;
    this._length = 0;
    this._sections.length = 0;
  }

  private _count = 0;
  private _length = 0;
  private _minimumSize: number;
  private _defaultSize: number;
  private _sections: Private.Section[] = [];
}

/**
 * The namespace for the `SectionList` class statics.
 */
export namespace SectionList {
  /**
   * An options object for initializing a section list.
   */
  export interface IOptions {
    /**
     * The size of new sections added to the list.
     */
    defaultSize: number;

    /**
     * The minimum size of the section list.
     */
    minimumSize?: number;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which represents a modified section.
   */
  export type Section = {
    /**
     * The index of the section.
     *
     * This is always `>= 0`.
     */
    index: number;

    /**
     * The offset of the section.
     */
    offset: number;

    /**
     * The size of the section.
     *
     * This is always `>= 0`.
     */
    size: number;
  };

  /**
   * A comparison function for searching by offset.
   */
  export function offsetCmp(section: Section, offset: number): number {
    if (offset < section.offset) {
      return 1;
    }
    if (section.offset + section.size <= offset) {
      return -1;
    }
    return 0;
  }

  /**
   * A comparison function for searching by index.
   */
  export function indexCmp(section: Section, index: number): number {
    return section.index - index;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { some } from '@lumino/algorithm';

import { ISignal, Signal } from '@lumino/signaling';

import { DataModel } from './datamodel';

/**
 * A base class for creating data grid selection models.
 *
 * #### Notes
 * If the predefined selection models are insufficient for a particular
 * use case, a custom model can be defined which derives from this class.
 */
export abstract class SelectionModel {
  /**
   * Construct a new selection model.
   *
   * @param options - The options for initializing the model.
   */
  constructor(options: SelectionModel.IOptions) {
    this.dataModel = options.dataModel;
    this._selectionMode = options.selectionMode || 'cell';
    this.dataModel.changed.connect(this.onDataModelChanged, this);
  }

  /**
   * Whether the selection model is empty.
   *
   * #### Notes
   * An empty selection model will yield an empty `selections` iterator.
   */
  abstract readonly isEmpty: boolean;

  /**
   * The row index of the cursor.
   *
   * This is `-1` if the selection model is empty.
   */
  abstract readonly cursorRow: number;

  /**
   * The column index of the cursor.
   *
   * This is `-1` if the selection model is empty.
   */
  abstract readonly cursorColumn: number;

  /**
   * Move cursor down/up/left/right while making sure it remains
   * within the bounds of selected rectangles
   *
   * @param direction - The direction of the movement.
   */
  abstract moveCursorWithinSelections(
    direction: SelectionModel.CursorMoveDirection
  ): void;

  /**
   * Get the current selection in the selection model.
   *
   * @returns The current selection or `null`.
   *
   * #### Notes
   * This is the selection which holds the cursor.
   */
  abstract currentSelection(): SelectionModel.Selection | null;

  /**
   * Get an iterator of the selections in the model.
   *
   * @returns A new iterator of the selections in the model.
   *
   * #### Notes
   * The data grid will render the selections in order.
   */
  abstract selections(): IterableIterator<SelectionModel.Selection>;

  /**
   * Select the specified cells.
   *
   * @param args - The arguments for the selection.
   */
  abstract select(args: SelectionModel.SelectArgs): void;

  /**
   * Clear all selections in the selection model.
   */
  abstract clear(): void;

  /**
   * A signal emitted when the selection model has changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * The data model associated with the selection model.
   */
  readonly dataModel: DataModel;

  /**
   * Get the selection mode for the model.
   */
  get selectionMode(): SelectionModel.SelectionMode {
    return this._selectionMode;
  }

  /**
   * Set the selection mode for the model.
   *
   * #### Notes
   * This will clear the selection model.
   */
  set selectionMode(value: SelectionModel.SelectionMode) {
    // Bail early if the mode does not change.
    if (this._selectionMode === value) {
      return;
    }

    // Update the internal mode.
    this._selectionMode = value;

    // Clear the current selections.
    this.clear();
  }

  /**
   * Test whether any selection intersects a row.
   *
   * @param index - The row index of interest.
   *
   * @returns Whether any selection intersects the row.
   *
   * #### Notes
   * This method may be reimplemented in a subclass.
   */
  isRowSelected(index: number): boolean {
    return some(this.selections(), s => Private.containsRow(s, index));
  }

  /**
   * Test whether any selection intersects a column.
   *
   * @param index - The column index of interest.
   *
   * @returns Whether any selection intersects the column.
   *
   * #### Notes
   * This method may be reimplemented in a subclass.
   */
  isColumnSelected(index: number): boolean {
    return some(this.selections(), s => Private.containsColumn(s, index));
  }

  /**
   * Test whether any selection intersects a cell.
   *
   * @param row - The row index of interest.
   *
   * @param column - The column index of interest.
   *
   * @returns Whether any selection intersects the cell.
   *
   * #### Notes
   * This method may be reimplemented in a subclass.
   */
  isCellSelected(row: number, column: number): boolean {
    return some(this.selections(), s => Private.containsCell(s, row, column));
  }

  /**
   * A signal handler for the data model `changed` signal.
   *
   * @param args - The arguments for the signal.
   *
   * #### Notes
   * Selection model implementations should update their selections
   * in a manner that is relevant for the changes to the data model.
   *
   * The default implementation of this method is a no-op.
   */
  protected onDataModelChanged(
    sender: DataModel,
    args: DataModel.ChangedArgs
  ): void {
    // pass
  }

  /**
   * Emit the `changed` signal for the selection model.
   *
   * #### Notes
   * Subclasses should call this method whenever the selection model
   * has changed so that attached data grids can update themselves.
   */
  protected emitChanged(): void {
    this._changed.emit(undefined);
  }

  private _changed = new Signal<this, void>(this);
  private _selectionMode: SelectionModel.SelectionMode = 'cell';
}

/**
 * The namespace for the `SelectionModel` class statics.
 */
export namespace SelectionModel {
  /**
   * A type alias for the selection mode.
   */
  export type SelectionMode = 'row' | 'column' | 'cell';

  /**
   * A type alias for the cursor move direction.
   */
  export type CursorMoveDirection = 'up' | 'down' | 'left' | 'right' | 'none';

  /**
   * A type alias for the clear mode.
   */
  export type ClearMode = 'all' | 'current' | 'none';

  /**
   * A type alias for the select args.
   */
  export type SelectArgs = {
    /**
     * The first row of the selection.
     *
     * This may be greater than `r2`.
     */
    r1: number;

    /**
     * The first column of the selection.
     *
     * This may be greater than `c2`.
     */
    c1: number;

    /**
     * The last row of the selection.
     *
     * This may be less than `r1`.
     */
    r2: number;

    /**
     * The last column of the selection.
     *
     * This may be less than `c1`.
     */
    c2: number;

    /**
     * The row index for the cursor.
     *
     * This should be contained within the selection.
     */
    cursorRow: number;

    /**
     * The column index for the cursor.
     *
     * This should be contained within the selection.
     */
    cursorColumn: number;

    /**
     * Which of the existing selections to clear.
     */
    clear: ClearMode;
  };

  /**
   * A type alias for a selection in a selection model.
   */
  export type Selection = {
    /**
     * The first row of the selection.
     *
     * This may be greater than `r2`.
     */
    readonly r1: number;

    /**
     * The first column of the selection.
     *
     * This may be greater than `c2`.
     */
    readonly c1: number;

    /**
     * The last row of the selection.
     *
     * This may be less than `r1`.
     */
    readonly r2: number;

    /**
     * The last column of the selection.
     *
     * This may be less than `c1`.
     */
    readonly c2: number;
  };

  /**
   * An options object for initializing a selection model.
   */
  export interface IOptions {
    /**
     * The data model for the selection model.
     */
    dataModel: DataModel;

    /**
     * The selection mode for the model.
     *
     * The default is `'cell'`.
     */
    selectionMode?: SelectionMode;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Test whether a selection contains a given row.
   */
  export function containsRow(
    selection: SelectionModel.Selection,
    row: number
  ): boolean {
    let { r1, r2 } = selection;
    return (row >= r1 && row <= r2) || (row >= r2 && row <= r1);
  }

  /**
   * Test whether a selection contains a given column.
   */
  export function containsColumn(
    selection: SelectionModel.Selection,
    column: number
  ): boolean {
    let { c1, c2 } = selection;
    return (column >= c1 && column <= c2) || (column >= c2 && column <= c1);
  }

  /**
   * Test whether a selection contains a given cell.
   */
  export function containsCell(
    selection: SelectionModel.Selection,
    row: number,
    column: number
  ): boolean {
    return containsRow(selection, row) && containsColumn(selection, column);
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { CellRenderer } from './cellrenderer';

import { GraphicsContext } from './graphicscontext';

/**
 * A cell renderer which renders data values as text.
 */
export class TextRenderer extends CellRenderer {
  /**
   * Construct a new text renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: TextRenderer.IOptions = {}) {
    super();
    this.font = options.font || '12px sans-serif';
    this.textColor = options.textColor || '#000000';
    this.backgroundColor = options.backgroundColor || '';
    this.verticalAlignment = options.verticalAlignment || 'center';
    this.horizontalAlignment = options.horizontalAlignment || 'left';
    this.format = options.format || TextRenderer.formatGeneric();
    this.elideDirection = options.elideDirection || 'right';
    this.wrapText = options.wrapText || false;
  }

  /**
   * The CSS shorthand font for drawing the text.
   */
  readonly font: CellRenderer.ConfigOption<string>;

  /**
   * The CSS color for drawing the text.
   */
  readonly textColor: CellRenderer.ConfigOption<string>;

  /**
   * The CSS color for the cell background.
   */
  readonly backgroundColor: CellRenderer.ConfigOption<string>;

  /**
   * The vertical alignment for the cell text.
   */
  readonly verticalAlignment: CellRenderer.ConfigOption<TextRenderer.VerticalAlignment>;

  /**
   * The horizontal alignment for the cell text.
   */
  readonly horizontalAlignment: CellRenderer.ConfigOption<TextRenderer.HorizontalAlignment>;

  /**
   * The format function for the cell value.
   */
  readonly format: TextRenderer.FormatFunc;

  /**
   * Which side to draw the ellipsis.
   */
  readonly elideDirection: CellRenderer.ConfigOption<TextRenderer.ElideDirection>;

  /**
   * Boolean flag for applying text wrapping.
   */
  readonly wrapText: CellRenderer.ConfigOption<boolean>;

  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    this.drawBackground(gc, config);
    this.drawText(gc, config);
  }

  /**
   * Draw the background for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawBackground(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    // Resolve the background color for the cell.
    let color = CellRenderer.resolveOption(this.backgroundColor, config);

    // Bail if there is no background color to draw.
    if (!color) {
      return;
    }

    // Fill the cell with the background color.
    gc.fillStyle = color;
    gc.fillRect(config.x, config.y, config.width, config.height);
  }

  /**
   * Draw the text for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawText(gc: GraphicsContext, config: CellRenderer.CellConfig): void {
    // Resolve the font for the cell.
    let font = CellRenderer.resolveOption(this.font, config);

    // Bail if there is no font to draw.
    if (!font) {
      return;
    }

    // Resolve the text color for the cell.
    let color = CellRenderer.resolveOption(this.textColor, config);

    // Bail if there is no text color to draw.
    if (!color) {
      return;
    }

    // Format the cell value to text.
    let format = this.format;
    let text = format(config);

    // Bail if there is no text to draw.
    if (!text) {
      return;
    }

    // Resolve the vertical and horizontal alignment.
    let vAlign = CellRenderer.resolveOption(this.verticalAlignment, config);
    let hAlign = CellRenderer.resolveOption(this.horizontalAlignment, config);

    // Resolve the elision direction
    let elideDirection = CellRenderer.resolveOption(
      this.elideDirection,
      config
    );

    // Resolve the text wrapping flag
    let wrapText = CellRenderer.resolveOption(this.wrapText, config);

    // Compute the padded text box height for the specified alignment.
    let boxHeight = config.height - (vAlign === 'center' ? 1 : 2);

    // Bail if the text box has no effective size.
    if (boxHeight <= 0) {
      return;
    }

    // Compute the text height for the gc font.
    let textHeight = TextRenderer.measureFontHeight(font);

    // Set up the text position variables.
    let textX: number;
    let textY: number;
    let boxWidth: number;

    // Compute the Y position for the text.
    switch (vAlign) {
      case 'top':
        textY = config.y + 2 + textHeight;
        break;
      case 'center':
        textY = config.y + config.height / 2 + textHeight / 2;
        break;
      case 'bottom':
        textY = config.y + config.height - 2;
        break;
      default:
        throw 'unreachable';
    }

    // Compute the X position for the text.
    switch (hAlign) {
      case 'left':
        textX = config.x + 8;
        boxWidth = config.width - 14;
        break;
      case 'center':
        textX = config.x + config.width / 2;
        boxWidth = config.width;
        break;
      case 'right':
        textX = config.x + config.width - 8;
        boxWidth = config.width - 14;
        break;
      default:
        throw 'unreachable';
    }

    // Clip the cell if the text is taller than the text box height.
    if (textHeight > boxHeight) {
      gc.beginPath();
      gc.rect(config.x, config.y, config.width, config.height - 1);
      gc.clip();
    }

    // Set the gc state.
    gc.font = font;
    gc.fillStyle = color;
    gc.textAlign = hAlign;
    gc.textBaseline = 'bottom';

    // The current text width in pixels.
    let textWidth = gc.measureText(text).width;

    // Apply text wrapping if enabled.
    if (wrapText && textWidth > boxWidth) {
      // Make sure box clipping happens.
      gc.beginPath();
      gc.rect(config.x, config.y, config.width, config.height - 1);
      gc.clip();

      // Split column name to words based on
      // whitespace preceding a word boundary.
      // "Hello  world" --> ["Hello  ", "world"]
      const wordsInColumn = text.split(/\s(?=\b)/);

      // Y-coordinate offset for any additional lines
      let curY = textY;
      let textInCurrentLine = wordsInColumn.shift()!;

      // Single word. Applying text wrap on word by splitting
      // it into characters and fitting the maximum number of
      // characters possible per line (box width).
      if (wordsInColumn.length === 0) {
        let curLineTextWidth = gc.measureText(textInCurrentLine).width;
        while (curLineTextWidth > boxWidth && textInCurrentLine !== '') {
          // Iterating from the end of the string until we find a
          // substring (0,i) which has a width less than the box width.
          for (let i = textInCurrentLine.length; i > 0; i--) {
            const curSubString = textInCurrentLine.substring(0, i);
            const curSubStringWidth = gc.measureText(curSubString).width;
            if (curSubStringWidth < boxWidth || curSubString.length === 1) {
              // Found a substring which has a width less than the current
              // box width. Rendering that substring on the current line
              // and setting the remainder of the parent string as the next
              // string to iterate on for the next line.
              const nextLineText = textInCurrentLine.substring(
                i,
                textInCurrentLine.length
              );
              textInCurrentLine = nextLineText;
              curLineTextWidth = gc.measureText(textInCurrentLine).width;
              gc.fillText(curSubString, textX, curY);
              curY += textHeight;
              // No need to continue iterating after we identified
              // an index to break the string on.
              break;
            }
          }
        }
      }

      // Multiple words in column header. Fitting maximum
      // number of words possible per line (box width).
      else {
        while (wordsInColumn.length !== 0) {
          // Processing the next word in the queue.
          const curWord = wordsInColumn.shift();
          // Joining that word with the existing text for
          // the current line.
          const incrementedText = [textInCurrentLine, curWord].join(' ');
          const incrementedTextWidth = gc.measureText(incrementedText).width;
          if (incrementedTextWidth > boxWidth) {
            // If the newly combined text has a width larger than
            // the box width, we render the line before the current
            // word was added. We set the current word as the next
            // line.
            gc.fillText(textInCurrentLine, textX, curY);
            curY += textHeight;
            textInCurrentLine = curWord!;
          } else {
            // The combined text hasd a width less than the box width. We
            // set the the current line text to be the new combined text.
            textInCurrentLine = incrementedText;
          }
        }
      }
      gc.fillText(textInCurrentLine!, textX, curY);
      // Terminating the call here as we don't want
      // to apply text eliding when wrapping is active.
      return;
    }

    // Elide text that is too long
    let elide = '\u2026';

    // Compute elided text
    if (elideDirection === 'right') {
      while (textWidth > boxWidth && text.length > 1) {
        if (text.length > 4 && textWidth >= 2 * boxWidth) {
          // If text width is substantially bigger, take half the string
          text = text.substring(0, text.length / 2 + 1) + elide;
        } else {
          // Otherwise incrementally remove the last character
          text = text.substring(0, text.length - 2) + elide;
        }
        textWidth = gc.measureText(text).width;
      }
    } else {
      while (textWidth > boxWidth && text.length > 1) {
        if (text.length > 4 && textWidth >= 2 * boxWidth) {
          // If text width is substantially bigger, take half the string
          text = elide + text.substring(text.length / 2);
        } else {
          // Otherwise incrementally remove the last character
          text = elide + text.substring(2);
        }
        textWidth = gc.measureText(text).width;
      }
    }

    // Draw the text for the cell.
    gc.fillText(text, textX, textY);
  }
}

/**
 * The namespace for the `TextRenderer` class statics.
 */
export namespace TextRenderer {
  /**
   * A type alias for the supported vertical alignment modes.
   */
  export type VerticalAlignment = 'top' | 'center' | 'bottom';

  /**
   * A type alias for the supported horizontal alignment modes.
   */
  export type HorizontalAlignment = 'left' | 'center' | 'right';

  /**
   * A type alias for the supported ellipsis sides.
   */
  export type ElideDirection = 'left' | 'right';

  /**
   * An options object for initializing a text renderer.
   */
  export interface IOptions {
    /**
     * The font for drawing the cell text.
     *
     * The default is `'12px sans-serif'`.
     */
    font?: CellRenderer.ConfigOption<string>;

    /**
     * The color for the drawing the cell text.
     *
     * The default `'#000000'`.
     */
    textColor?: CellRenderer.ConfigOption<string>;

    /**
     * The background color for the cells.
     *
     * The default is `''`.
     */
    backgroundColor?: CellRenderer.ConfigOption<string>;

    /**
     * The vertical alignment for the cell text.
     *
     * The default is `'center'`.
     */
    verticalAlignment?: CellRenderer.ConfigOption<VerticalAlignment>;

    /**
     * The horizontal alignment for the cell text.
     *
     * The default is `'left'`.
     */
    horizontalAlignment?: CellRenderer.ConfigOption<HorizontalAlignment>;

    /**
     * The format function for the renderer.
     *
     * The default is `TextRenderer.formatGeneric()`.
     */
    format?: FormatFunc;

    /**
     * The ellipsis direction for the cell text.
     *
     * The default is `'right'`.
     */
    elideDirection?: CellRenderer.ConfigOption<ElideDirection>;

    /**
     * Whether or not to apply text wrapping.
     *
     * The default is `'false'`.
     */
    wrapText?: CellRenderer.ConfigOption<boolean>;
  }

  /**
   * A type alias for a format function.
   */
  export type FormatFunc = CellRenderer.ConfigFunc<string>;

  /**
   * Create a generic text format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new generic text format function.
   *
   * #### Notes
   * This formatter uses the builtin `String()` to coerce any value
   * to a string.
   */
  export function formatGeneric(
    options: formatGeneric.IOptions = {}
  ): FormatFunc {
    let missing = options.missing || '';
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      return String(value);
    };
  }

  /**
   * The namespace for the `formatGeneric` function statics.
   */
  export namespace formatGeneric {
    /**
     * The options for creating a generic format function.
     */
    export interface IOptions {
      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Create a fixed decimal format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new fixed decimal format function.
   *
   * #### Notes
   * This formatter uses the builtin `Number()` and `toFixed()` to
   * coerce values.
   *
   * The `formatIntlNumber()` formatter is more flexible, but slower.
   */
  export function formatFixed(options: formatFixed.IOptions = {}): FormatFunc {
    let digits = options.digits;
    let missing = options.missing || '';
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      return Number(value).toFixed(digits);
    };
  }

  /**
   * The namespace for the `formatFixed` function statics.
   */
  export namespace formatFixed {
    /**
     * The options for creating a fixed format function.
     */
    export interface IOptions {
      /**
       * The number of digits to include after the decimal point.
       *
       * The default is determined by the user agent.
       */
      digits?: number;

      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Create a significant figure format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new significant figure format function.
   *
   * #### Notes
   * This formatter uses the builtin `Number()` and `toPrecision()`
   * to coerce values.
   *
   * The `formatIntlNumber()` formatter is more flexible, but slower.
   */
  export function formatPrecision(
    options: formatPrecision.IOptions = {}
  ): FormatFunc {
    let digits = options.digits;
    let missing = options.missing || '';
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      return Number(value).toPrecision(digits);
    };
  }

  /**
   * The namespace for the `formatPrecision` function statics.
   */
  export namespace formatPrecision {
    /**
     * The options for creating a precision format function.
     */
    export interface IOptions {
      /**
       * The number of significant figures to include in the value.
       *
       * The default is determined by the user agent.
       */
      digits?: number;

      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Create a scientific notation format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new scientific notation format function.
   *
   * #### Notes
   * This formatter uses the builtin `Number()` and `toExponential()`
   * to coerce values.
   *
   * The `formatIntlNumber()` formatter is more flexible, but slower.
   */
  export function formatExponential(
    options: formatExponential.IOptions = {}
  ): FormatFunc {
    let digits = options.digits;
    let missing = options.missing || '';
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      return Number(value).toExponential(digits);
    };
  }

  /**
   * The namespace for the `formatExponential` function statics.
   */
  export namespace formatExponential {
    /**
     * The options for creating an exponential format function.
     */
    export interface IOptions {
      /**
       * The number of digits to include after the decimal point.
       *
       * The default is determined by the user agent.
       */
      digits?: number;

      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Create an international number format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new international number format function.
   *
   * #### Notes
   * This formatter uses the builtin `Intl.NumberFormat` object to
   * coerce values.
   *
   * This is the most flexible (but slowest) number formatter.
   */
  export function formatIntlNumber(
    options: formatIntlNumber.IOptions = {}
  ): FormatFunc {
    let missing = options.missing || '';
    let nft = new Intl.NumberFormat(options.locales, options.options);
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      return nft.format(value);
    };
  }

  /**
   * The namespace for the `formatIntlNumber` function statics.
   */
  export namespace formatIntlNumber {
    /**
     * The options for creating an intl number format function.
     */
    export interface IOptions {
      /**
       * The locales to pass to the `Intl.NumberFormat` constructor.
       *
       * The default is determined by the user agent.
       */
      locales?: string | string[];

      /**
       * The options to pass to the `Intl.NumberFormat` constructor.
       *
       * The default is determined by the user agent.
       */
      options?: Intl.NumberFormatOptions;

      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Create a date format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new date format function.
   *
   * #### Notes
   * This formatter uses `Date.toDateString()` to format the values.
   *
   * If a value is not a `Date` object, `new Date(value)` is used to
   * coerce the value to a date.
   *
   * The `formatIntlDateTime()` formatter is more flexible, but slower.
   */
  export function formatDate(options: formatDate.IOptions = {}): FormatFunc {
    let missing = options.missing || '';
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      if (value instanceof Date) {
        return value.toDateString();
      }
      return new Date(value).toDateString();
    };
  }

  /**
   * The namespace for the `formatDate` function statics.
   */
  export namespace formatDate {
    /**
     * The options for creating a date format function.
     */
    export interface IOptions {
      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Create a time format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new time format function.
   *
   * #### Notes
   * This formatter uses `Date.toTimeString()` to format the values.
   *
   * If a value is not a `Date` object, `new Date(value)` is used to
   * coerce the value to a date.
   *
   * The `formatIntlDateTime()` formatter is more flexible, but slower.
   */
  export function formatTime(options: formatTime.IOptions = {}): FormatFunc {
    let missing = options.missing || '';
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      if (value instanceof Date) {
        return value.toTimeString();
      }
      return new Date(value).toTimeString();
    };
  }

  /**
   * The namespace for the `formatTime` function statics.
   */
  export namespace formatTime {
    /**
     * The options for creating a time format function.
     */
    export interface IOptions {
      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Create an ISO datetime format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new ISO datetime format function.
   *
   * #### Notes
   * This formatter uses `Date.toISOString()` to format the values.
   *
   * If a value is not a `Date` object, `new Date(value)` is used to
   * coerce the value to a date.
   *
   * The `formatIntlDateTime()` formatter is more flexible, but slower.
   */
  export function formatISODateTime(
    options: formatISODateTime.IOptions = {}
  ): FormatFunc {
    let missing = options.missing || '';
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return new Date(value).toISOString();
    };
  }

  /**
   * The namespace for the `formatISODateTime` function statics.
   */
  export namespace formatISODateTime {
    /**
     * The options for creating an ISO datetime format function.
     */
    export interface IOptions {
      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Create a UTC datetime format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new UTC datetime format function.
   *
   * #### Notes
   * This formatter uses `Date.toUTCString()` to format the values.
   *
   * If a value is not a `Date` object, `new Date(value)` is used to
   * coerce the value to a date.
   *
   * The `formatIntlDateTime()` formatter is more flexible, but slower.
   */
  export function formatUTCDateTime(
    options: formatUTCDateTime.IOptions = {}
  ): FormatFunc {
    let missing = options.missing || '';
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      if (value instanceof Date) {
        return value.toUTCString();
      }
      return new Date(value).toUTCString();
    };
  }

  /**
   * The namespace for the `formatUTCDateTime` function statics.
   */
  export namespace formatUTCDateTime {
    /**
     * The options for creating a UTC datetime format function.
     */
    export interface IOptions {
      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Create an international datetime format function.
   *
   * @param options - The options for creating the format function.
   *
   * @returns A new international datetime format function.
   *
   * #### Notes
   * This formatter uses the builtin `Intl.DateTimeFormat` object to
   * coerce values.
   *
   * This is the most flexible (but slowest) datetime formatter.
   */
  export function formatIntlDateTime(
    options: formatIntlDateTime.IOptions = {}
  ): FormatFunc {
    let missing = options.missing || '';
    let dtf = new Intl.DateTimeFormat(options.locales, options.options);
    return ({ value }) => {
      if (value === null || value === undefined) {
        return missing;
      }
      return dtf.format(value);
    };
  }

  /**
   * The namespace for the `formatIntlDateTime` function statics.
   */
  export namespace formatIntlDateTime {
    /**
     * The options for creating an intl datetime format function.
     */
    export interface IOptions {
      /**
       * The locales to pass to the `Intl.DateTimeFormat` constructor.
       *
       * The default is determined by the user agent.
       */
      locales?: string | string[];

      /**
       * The options to pass to the `Intl.DateTimeFormat` constructor.
       *
       * The default is determined by the user agent.
       */
      options?: Intl.DateTimeFormatOptions;

      /**
       * The text to use for a `null` or `undefined` data value.
       *
       * The default is `''`.
       */
      missing?: string;
    }
  }

  /**
   * Measure the height of a font.
   *
   * @param font - The CSS font string of interest.
   *
   * @returns The height of the font bounding box.
   *
   * #### Notes
   * This function uses a temporary DOM node to measure the text box
   * height for the specified font. The first call for a given font
   * will incur a DOM reflow, but the return value is cached, so any
   * subsequent call for the same font will return the cached value.
   */
  export function measureFontHeight(font: string): number {
    // Look up the cached font height.
    let height = Private.fontHeightCache[font];

    // Return the cached font height if it exists.
    if (height !== undefined) {
      return height;
    }

    // Normalize the font.
    Private.fontMeasurementGC.font = font;
    let normFont = Private.fontMeasurementGC.font;

    // Set the font on the measurement node.
    Private.fontMeasurementNode.style.font = normFont;

    // Add the measurement node to the document.
    document.body.appendChild(Private.fontMeasurementNode);

    // Measure the node height.
    height = Private.fontMeasurementNode.offsetHeight;

    // Remove the measurement node from the document.
    document.body.removeChild(Private.fontMeasurementNode);

    // Cache the measured height for the font and norm font.
    Private.fontHeightCache[font] = height;
    Private.fontHeightCache[normFont] = height;

    // Return the measured height.
    return height;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A cache of measured font heights.
   */
  export const fontHeightCache: { [font: string]: number } =
    Object.create(null);

  /**
   * The DOM node used for font height measurement.
   */
  export const fontMeasurementNode = (() => {
    let node = document.createElement('div');
    node.style.position = 'absolute';
    node.style.top = '-99999px';
    node.style.left = '-99999px';
    node.style.visibility = 'hidden';
    node.textContent = 'M';
    return node;
  })();

  /**
   * The GC used for font measurement.
   */
  export const fontMeasurementGC = (() => {
    let canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    return canvas.getContext('2d')!;
  })();
}
