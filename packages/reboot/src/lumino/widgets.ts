/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

import { ArrayExt } from '@lumino/algorithm';
import { SplitLayout } from './splitlayout';
import { Title } from './title';
import Utils from './utils';
import { Widget } from './widget';

/**
 * A layout which arranges its widgets into collapsible resizable sections.
 */
export class AccordionLayout extends SplitLayout {
  /**
   * Construct a new accordion layout.
   *
   * @param options - The options for initializing the layout.
   *
   * #### Notes
   * The default orientation will be vertical.
   *
   * Titles must be rotated for horizontal accordion panel using CSS: see accordionpanel.css
   */
  constructor(options: AccordionLayout.IOptions) {
    super({ ...options, orientation: options.orientation || 'vertical' });
    this.titleSpace = options.titleSpace || 22;
  }

  /**
   * The section title height or width depending on the orientation.
   */
  get titleSpace(): number {
    return this.widgetOffset;
  }
  set titleSpace(value: number) {
    value = Utils.clampDimension(value);
    if (this.widgetOffset === value) {
      return;
    }
    this.widgetOffset = value;
    if (!this.parent) {
      return;
    }
    this.parent.fit();
  }

  /**
   * A read-only array of the section titles in the panel.
   */
  get titles(): ReadonlyArray<HTMLElement> {
    return this._titles;
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    // Clear the layout state.
    this._titles.length = 0;

    // Dispose of the rest of the layout.
    super.dispose();
  }

  /**
   * The renderer used by the accordion layout.
   */
  readonly renderer: AccordionLayout.IRenderer;

  public updateTitle(index: number, widget: Widget): void {
    const oldTitle = this._titles[index];
    const expanded = oldTitle.classList.contains('lm-mod-expanded');
    const newTitle = Private.createTitle(this.renderer, widget.title, expanded);
    this._titles[index] = newTitle;

    // Add the title node to the parent before the widget.
    this.parent!.node.replaceChild(newTitle, oldTitle);
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param index - The current index of the widget in the layout.
   *
   * @param widget - The widget to attach to the parent.
   */
  protected attachWidget(index: number, widget: Widget): void {
    const title = Private.createTitle(this.renderer, widget.title);

    ArrayExt.insert(this._titles, index, title);

    // Add the title node to the parent before the widget.
    this.parent!.node.appendChild(title);

    widget.node.setAttribute('role', 'region');
    widget.node.setAttribute('aria-labelledby', title.id);

    super.attachWidget(index, widget);
  }

  /**
   * Move a widget in the parent's DOM node.
   *
   * @param fromIndex - The previous index of the widget in the layout.
   *
   * @param toIndex - The current index of the widget in the layout.
   *
   * @param widget - The widget to move in the parent.
   */
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    ArrayExt.move(this._titles, fromIndex, toIndex);
    super.moveWidget(fromIndex, toIndex, widget);
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param index - The previous index of the widget in the layout.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected detachWidget(index: number, widget: Widget): void {
    const title = ArrayExt.removeAt(this._titles, index);

    this.parent!.node.removeChild(title!);

    super.detachWidget(index, widget);
  }

  /**
   * Update the item position.
   *
   * @param i Item index
   * @param isHorizontal Whether the layout is horizontal or not
   * @param left Left position in pixels
   * @param top Top position in pixels
   * @param height Item height
   * @param width Item width
   * @param size Item size
   */
  protected updateItemPosition(
    i: number,
    isHorizontal: boolean,
    left: number,
    top: number,
    height: number,
    width: number,
    size: number
  ): void {
    const titleStyle = this._titles[i].style;

    // Titles must be rotated for horizontal accordion panel using CSS: see accordionpanel.css
    titleStyle.top = `${top}px`;
    titleStyle.left = `${left}px`;
    titleStyle.height = `${this.widgetOffset}px`;
    if (isHorizontal) {
      titleStyle.width = `${height}px`;
    } else {
      titleStyle.width = `${width}px`;
    }

    super.updateItemPosition(i, isHorizontal, left, top, height, width, size);
  }

  private _titles: HTMLElement[] = [];
}

export namespace AccordionLayout {
  /**
   * A type alias for a accordion layout orientation.
   */
  export type Orientation = SplitLayout.Orientation;

  /**
   * A type alias for a accordion layout alignment.
   */
  export type Alignment = SplitLayout.Alignment;

  /**
   * An options object for initializing a accordion layout.
   */
  export interface IOptions extends SplitLayout.IOptions {
    /**
     * The renderer to use for the accordion layout.
     */
    renderer: IRenderer;

    /**
     * The section title height or width depending on the orientation.
     *
     * The default is `22`.
     */
    titleSpace?: number;
  }

  /**
   * A renderer for use with an accordion layout.
   */
  export interface IRenderer extends SplitLayout.IRenderer {
    /**
     * Common class name for all accordion titles.
     */
    readonly titleClassName: string;

    /**
     * Render the element for a section title.
     *
     * @param data - The data to use for rendering the section title.
     *
     * @returns A element representing the section title.
     */
    createSectionTitle(title: Title<Widget>): HTMLElement;
  }
}

namespace Private {
  /**
   * Create the title HTML element.
   *
   * @param renderer Accordion renderer
   * @param data Widget title
   * @returns Title HTML element
   */
  export function createTitle(
    renderer: AccordionLayout.IRenderer,
    data: Title<Widget>,
    expanded: boolean = true
  ): HTMLElement {
    const title = renderer.createSectionTitle(data);
    title.style.position = 'absolute';
    title.setAttribute('aria-label', `${data.label} Section`);
    title.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    title.setAttribute('aria-controls', data.owner.id);
    if (expanded) {
      title.classList.add('lm-mod-expanded');
    }
    return title;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { ArrayExt } from '@lumino/algorithm';
import { Message } from '@lumino/messaging';
import { AccordionLayout } from './accordionlayout';
import { SplitLayout } from './splitlayout';
import { SplitPanel } from './splitpanel';
import { Title } from './title';
import { Widget } from './widget';

/**
 * A panel which arranges its widgets into resizable sections separated by a title widget.
 *
 * #### Notes
 * This class provides a convenience wrapper around [[AccordionLayout]].
 */
export class AccordionPanel extends SplitPanel {
  /**
   * Construct a new accordion panel.
   *
   * @param options - The options for initializing the accordion panel.
   */
  constructor(options: AccordionPanel.IOptions = {}) {
    super({ ...options, layout: Private.createLayout(options) });
    this.addClass('lm-AccordionPanel');
  }

  /**
   * The renderer used by the accordion panel.
   */
  get renderer(): AccordionPanel.IRenderer {
    return (this.layout as AccordionLayout).renderer;
  }

  /**
   * The section title space.
   *
   * This is the height if the panel is vertical and the width if it is
   * horizontal.
   */
  get titleSpace(): number {
    return (this.layout as AccordionLayout).titleSpace;
  }
  set titleSpace(value: number) {
    (this.layout as AccordionLayout).titleSpace = value;
  }

  /**
   * A read-only array of the section titles in the panel.
   */
  get titles(): ReadonlyArray<HTMLElement> {
    return (this.layout as AccordionLayout).titles;
  }

  /**
   * Add a widget to the end of the panel.
   *
   * @param widget - The widget to add to the panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   */
  addWidget(widget: Widget): void {
    super.addWidget(widget);
    widget.title.changed.connect(this._onTitleChanged, this);
  }

  /**
   * Collapse the widget at position `index`.
   *
   * #### Notes
   * If no widget is found for `index`, this will bail.
   *
   * @param index Widget index
   */
  collapse(index: number): void {
    const widget = (this.layout as AccordionLayout).widgets[index];

    if (widget && !widget.isHidden) {
      this._toggleExpansion(index);
    }
  }

  /**
   * Expand the widget at position `index`.
   *
   * #### Notes
   * If no widget is found for `index`, this will bail.
   *
   * @param index Widget index
   */
  expand(index: number): void {
    const widget = (this.layout as AccordionLayout).widgets[index];

    if (widget && widget.isHidden) {
      this._toggleExpansion(index);
    }
  }

  /**
   * Insert a widget at the specified index.
   *
   * @param index - The index at which to insert the widget.
   *
   * @param widget - The widget to insert into to the panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   */
  insertWidget(index: number, widget: Widget): void {
    super.insertWidget(index, widget);
    widget.title.changed.connect(this._onTitleChanged, this);
  }

  /**
   * Handle the DOM events for the accordion panel.
   *
   * @param event - The DOM event sent to the panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the panel's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    super.handleEvent(event);
    switch (event.type) {
      case 'click':
        this._evtClick(event as MouseEvent);
        break;
      case 'keydown':
        this._eventKeyDown(event as KeyboardEvent);
        break;
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('click', this);
    this.node.addEventListener('keydown', this);
    super.onBeforeAttach(msg);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg);
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('keydown', this);
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title<Widget>): void {
    const index = ArrayExt.findFirstIndex(this.widgets, widget => {
      return widget.contains(sender.owner);
    });

    if (index >= 0) {
      (this.layout as AccordionLayout).updateTitle(index, sender.owner);
      this.update();
    }
  }

  /**
   * Compute the size of widgets in this panel on the title click event.
   * On closing, the size of the widget is cached and we will try to expand
   * the last opened widget.
   * On opening, we will use the cached size if it is available to restore the
   * widget.
   * In both cases, if we can not compute the size of widgets, we will let
   * `SplitLayout` decide.
   *
   * @param index - The index of widget to be opened of closed
   *
   * @returns Relative size of widgets in this panel, if this size can
   * not be computed, return `undefined`
   */
  private _computeWidgetSize(index: number): number[] | undefined {
    const layout = this.layout as AccordionLayout;

    const widget = layout.widgets[index];
    if (!widget) {
      return undefined;
    }
    const isHidden = widget.isHidden;
    const widgetSizes = layout.absoluteSizes();
    const delta = (isHidden ? -1 : 1) * this.spacing;
    const totalSize = widgetSizes.reduce(
      (prev: number, curr: number) => prev + curr
    );

    let newSize = [...widgetSizes];

    if (!isHidden) {
      // Hide the widget
      const currentSize = widgetSizes[index];

      this._widgetSizesCache.set(widget, currentSize);
      newSize[index] = 0;

      const widgetToCollapse = newSize.map(sz => sz > 0).lastIndexOf(true);
      if (widgetToCollapse === -1) {
        // All widget are closed, let the `SplitLayout` compute widget sizes.
        return undefined;
      }

      newSize[widgetToCollapse] =
        widgetSizes[widgetToCollapse] + currentSize + delta;
    } else {
      // Show the widget
      const previousSize = this._widgetSizesCache.get(widget);
      if (!previousSize) {
        // Previous size is unavailable, let the `SplitLayout` compute widget sizes.
        return undefined;
      }
      newSize[index] += previousSize;

      const widgetToCollapse = newSize
        .map(sz => sz - previousSize > 0)
        .lastIndexOf(true);
      if (widgetToCollapse === -1) {
        // Can not reduce the size of one widget, reduce all opened widgets
        // proportionally with its size.
        newSize.forEach((_, idx) => {
          if (idx !== index) {
            newSize[idx] -=
              (widgetSizes[idx] / totalSize) * (previousSize - delta);
          }
        });
      } else {
        newSize[widgetToCollapse] -= previousSize - delta;
      }
    }
    return newSize.map(sz => sz / (totalSize + delta));
  }
  /**
   * Handle the `'click'` event for the accordion panel
   */
  private _evtClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (target) {
      const index = ArrayExt.findFirstIndex(this.titles, title => {
        return title.contains(target);
      });

      if (index >= 0) {
        event.preventDefault();
        event.stopPropagation();
        this._toggleExpansion(index);
      }
    }
  }

  /**
   * Handle the `'keydown'` event for the accordion panel.
   */
  private _eventKeyDown(event: KeyboardEvent): void {
    if (event.defaultPrevented) {
      return;
    }

    const target = event.target as HTMLElement | null;
    let handled = false;
    if (target) {
      const index = ArrayExt.findFirstIndex(this.titles, title => {
        return title.contains(target);
      });

      if (index >= 0) {
        const keyCode = event.keyCode.toString();

        // If Space or Enter is pressed on title, emulate click event
        if (event.key.match(/Space|Enter/) || keyCode.match(/13|32/)) {
          target.click();
          handled = true;
        } else if (
          this.orientation === 'horizontal'
            ? event.key.match(/ArrowLeft|ArrowRight/) || keyCode.match(/37|39/)
            : event.key.match(/ArrowUp|ArrowDown/) || keyCode.match(/38|40/)
        ) {
          // If Up or Down (for vertical) / Left or Right (for horizontal) is pressed on title, loop on titles
          const direction =
            event.key.match(/ArrowLeft|ArrowUp/) || keyCode.match(/37|38/)
              ? -1
              : 1;
          const length = this.titles.length;
          const newIndex = (index + length + direction) % length;

          this.titles[newIndex].focus();
          handled = true;
        } else if (event.key === 'End' || keyCode === '35') {
          // If End is pressed on title, focus on the last title
          this.titles[this.titles.length - 1].focus();
          handled = true;
        } else if (event.key === 'Home' || keyCode === '36') {
          // If Home is pressed on title, focus on the first title
          this.titles[0].focus();
          handled = true;
        }
      }

      if (handled) {
        event.preventDefault();
      }
    }
  }

  private _toggleExpansion(index: number) {
    const title = this.titles[index];
    const widget = (this.layout as AccordionLayout).widgets[index];

    const newSize = this._computeWidgetSize(index);
    if (newSize) {
      this.setRelativeSizes(newSize, false);
    }

    if (widget.isHidden) {
      title.classList.add('lm-mod-expanded');
      title.setAttribute('aria-expanded', 'true');
      widget.show();
    } else {
      title.classList.remove('lm-mod-expanded');
      title.setAttribute('aria-expanded', 'false');
      widget.hide();
    }
  }

  private _widgetSizesCache: WeakMap<Widget, number> = new WeakMap();
}

/**
 * The namespace for the `AccordionPanel` class statics.
 */
export namespace AccordionPanel {
  /**
   * A type alias for a accordion panel orientation.
   */
  export type Orientation = SplitLayout.Orientation;

  /**
   * A type alias for a accordion panel alignment.
   */
  export type Alignment = SplitLayout.Alignment;

  /**
   * A type alias for a accordion panel renderer.
   */
  export type IRenderer = AccordionLayout.IRenderer;

  /**
   * An options object for initializing a accordion panel.
   */
  export interface IOptions extends Partial<AccordionLayout.IOptions> {
    /**
     * The accordion layout to use for the accordion panel.
     *
     * If this is provided, the other options are ignored.
     *
     * The default is a new `AccordionLayout`.
     */
    layout?: AccordionLayout;
  }

  /**
   * The default implementation of `IRenderer`.
   */
  export class Renderer extends SplitPanel.Renderer implements IRenderer {
    /**
     * A selector which matches any title node in the accordion.
     */
    readonly titleClassName = 'lm-AccordionPanel-title';

    /**
     * Render the collapse indicator for a section title.
     *
     * @param data - The data to use for rendering the section title.
     *
     * @returns A element representing the collapse indicator.
     */
    createCollapseIcon(data: Title<Widget>): HTMLElement {
      return document.createElement('span');
    }

    /**
     * Render the element for a section title.
     *
     * @param data - The data to use for rendering the section title.
     *
     * @returns A element representing the section title.
     */
    createSectionTitle(data: Title<Widget>): HTMLElement {
      const handle = document.createElement('h3');
      handle.setAttribute('role', 'button');
      handle.setAttribute('tabindex', '0');
      handle.id = this.createTitleKey(data);
      handle.className = this.titleClassName;
      handle.title = data.caption;
      for (const aData in data.dataset) {
        handle.dataset[aData] = data.dataset[aData];
      }

      const collapser = handle.appendChild(this.createCollapseIcon(data));
      collapser.className = 'lm-AccordionPanel-titleCollapser';

      const label = handle.appendChild(document.createElement('span'));
      label.className = 'lm-AccordionPanel-titleLabel';
      label.textContent = data.label;

      return handle;
    }

    /**
     * Create a unique render key for the title.
     *
     * @param data - The data to use for the title.
     *
     * @returns The unique render key for the title.
     *
     * #### Notes
     * This method caches the key against the section title the first time
     * the key is generated.
     */
    createTitleKey(data: Title<Widget>): string {
      let key = this._titleKeys.get(data);
      if (key === undefined) {
        key = `title-key-${this._titleID++}`;
        this._titleKeys.set(data, key);
      }
      return key;
    }

    private _titleID = 0;
    private _titleKeys = new WeakMap<Title<Widget>, string>();
  }

  /**
   * The default `Renderer` instance.
   */
  export const defaultRenderer = new Renderer();
}

namespace Private {
  /**
   * Create an accordion layout for the given panel options.
   *
   * @param options Panel options
   * @returns Panel layout
   */
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
        titleSpace: options.titleSpace
      })
    );
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

/**
 * A sizer object for use with the box engine layout functions.
 *
 * #### Notes
 * A box sizer holds the geometry information for an object along an
 * arbitrary layout orientation.
 *
 * For best performance, this class should be treated as a raw data
 * struct. It should not typically be subclassed.
 */
export class BoxSizer {
  /**
   * The preferred size for the sizer.
   *
   * #### Notes
   * The sizer will be given this initial size subject to its size
   * bounds. The sizer will not deviate from this size unless such
   * deviation is required to fit into the available layout space.
   *
   * There is no limit to this value, but it will be clamped to the
   * bounds defined by [[minSize]] and [[maxSize]].
   *
   * The default value is `0`.
   */
  sizeHint = 0;

  /**
   * The minimum size of the sizer.
   *
   * #### Notes
   * The sizer will never be sized less than this value, even if
   * it means the sizer will overflow the available layout space.
   *
   * It is assumed that this value lies in the range `[0, Infinity)`
   * and that it is `<=` to [[maxSize]]. Failure to adhere to this
   * constraint will yield undefined results.
   *
   * The default value is `0`.
   */
  minSize = 0;

  /**
   * The maximum size of the sizer.
   *
   * #### Notes
   * The sizer will never be sized greater than this value, even if
   * it means the sizer will underflow the available layout space.
   *
   * It is assumed that this value lies in the range `[0, Infinity]`
   * and that it is `>=` to [[minSize]]. Failure to adhere to this
   * constraint will yield undefined results.
   *
   * The default value is `Infinity`.
   */
  maxSize = Infinity;

  /**
   * The stretch factor for the sizer.
   *
   * #### Notes
   * This controls how much the sizer stretches relative to its sibling
   * sizers when layout space is distributed. A stretch factor of zero
   * is special and will cause the sizer to only be resized after all
   * other sizers with a stretch factor greater than zero have been
   * resized to their limits.
   *
   * It is assumed that this value is an integer that lies in the range
   * `[0, Infinity)`. Failure to adhere to this constraint will yield
   * undefined results.
   *
   * The default value is `1`.
   */
  stretch = 1;

  /**
   * The computed size of the sizer.
   *
   * #### Notes
   * This value is the output of a call to [[boxCalc]]. It represents
   * the computed size for the object along the layout orientation,
   * and will always lie in the range `[minSize, maxSize]`.
   *
   * This value is output only.
   *
   * Changing this value will have no effect.
   */
  size = 0;

  /**
   * An internal storage property for the layout algorithm.
   *
   * #### Notes
   * This value is used as temporary storage by the layout algorithm.
   *
   * Changing this value will have no effect.
   */
  done = false;
}

/**
 * The namespace for the box engine layout functions.
 */
export namespace BoxEngine {
  /**
   * Calculate the optimal layout sizes for a sequence of box sizers.
   *
   * This distributes the available layout space among the box sizers
   * according to the following algorithm:
   *
   * 1. Initialize the sizers's size to its size hint and compute the
   *    sums for each of size hint, min size, and max size.
   *
   * 2. If the total size hint equals the available space, return.
   *
   * 3. If the available space is less than the total min size, set all
   *    sizers to their min size and return.
   *
   * 4. If the available space is greater than the total max size, set
   *    all sizers to their max size and return.
   *
   * 5. If the layout space is less than the total size hint, distribute
   *    the negative delta as follows:
   *
   *    a. Shrink each sizer with a stretch factor greater than zero by
   *       an amount proportional to the negative space and the sum of
   *       stretch factors. If the sizer reaches its min size, remove
   *       it and its stretch factor from the computation.
   *
   *    b. If after adjusting all stretch sizers there remains negative
   *       space, distribute the space equally among the sizers with a
   *       stretch factor of zero. If a sizer reaches its min size,
   *       remove it from the computation.
   *
   * 6. If the layout space is greater than the total size hint,
   *    distribute the positive delta as follows:
   *
   *    a. Expand each sizer with a stretch factor greater than zero by
   *       an amount proportional to the postive space and the sum of
   *       stretch factors. If the sizer reaches its max size, remove
   *       it and its stretch factor from the computation.
   *
   *    b. If after adjusting all stretch sizers there remains positive
   *       space, distribute the space equally among the sizers with a
   *       stretch factor of zero. If a sizer reaches its max size,
   *       remove it from the computation.
   *
   * 7. return
   *
   * @param sizers - The sizers for a particular layout line.
   *
   * @param space - The available layout space for the sizers.
   *
   * @returns The delta between the provided available space and the
   *   actual consumed space. This value will be zero if the sizers
   *   can be adjusted to fit, negative if the available space is too
   *   small, and positive if the available space is too large.
   *
   * #### Notes
   * The [[size]] of each sizer is updated with the computed size.
   *
   * This function can be called at any time to recompute the layout for
   * an existing sequence of sizers. The previously computed results will
   * have no effect on the new output. It is therefore not necessary to
   * create new sizer objects on each resize event.
   */
  export function calc(sizers: ArrayLike<BoxSizer>, space: number): number {
    // Bail early if there is nothing to do.
    let count = sizers.length;
    if (count === 0) {
      return space;
    }

    // Setup the size and stretch counters.
    let totalMin = 0;
    let totalMax = 0;
    let totalSize = 0;
    let totalStretch = 0;
    let stretchCount = 0;

    // Setup the sizers and compute the totals.
    for (let i = 0; i < count; ++i) {
      let sizer = sizers[i];
      let min = sizer.minSize;
      let max = sizer.maxSize;
      let hint = sizer.sizeHint;
      sizer.done = false;
      sizer.size = Math.max(min, Math.min(hint, max));
      totalSize += sizer.size;
      totalMin += min;
      totalMax += max;
      if (sizer.stretch > 0) {
        totalStretch += sizer.stretch;
        stretchCount++;
      }
    }

    // If the space is equal to the total size, return early.
    if (space === totalSize) {
      return 0;
    }

    // If the space is less than the total min, minimize each sizer.
    if (space <= totalMin) {
      for (let i = 0; i < count; ++i) {
        let sizer = sizers[i];
        sizer.size = sizer.minSize;
      }
      return space - totalMin;
    }

    // If the space is greater than the total max, maximize each sizer.
    if (space >= totalMax) {
      for (let i = 0; i < count; ++i) {
        let sizer = sizers[i];
        sizer.size = sizer.maxSize;
      }
      return space - totalMax;
    }

    // The loops below perform sub-pixel precision sizing. A near zero
    // value is used for compares instead of zero to ensure that the
    // loop terminates when the subdivided space is reasonably small.
    let nearZero = 0.01;

    // A counter which is decremented each time a sizer is resized to
    // its limit. This ensures the loops terminate even if there is
    // space remaining to distribute.
    let notDoneCount = count;

    // Distribute negative delta space.
    if (space < totalSize) {
      // Shrink each stretchable sizer by an amount proportional to its
      // stretch factor. If a sizer reaches its min size it's marked as
      // done. The loop progresses in phases where each sizer is given
      // a chance to consume its fair share for the pass, regardless of
      // whether a sizer before it reached its limit. This continues
      // until the stretchable sizers or the free space is exhausted.
      let freeSpace = totalSize - space;
      while (stretchCount > 0 && freeSpace > nearZero) {
        let distSpace = freeSpace;
        let distStretch = totalStretch;
        for (let i = 0; i < count; ++i) {
          let sizer = sizers[i];
          if (sizer.done || sizer.stretch === 0) {
            continue;
          }
          let amt = (sizer.stretch * distSpace) / distStretch;
          if (sizer.size - amt <= sizer.minSize) {
            freeSpace -= sizer.size - sizer.minSize;
            totalStretch -= sizer.stretch;
            sizer.size = sizer.minSize;
            sizer.done = true;
            notDoneCount--;
            stretchCount--;
          } else {
            freeSpace -= amt;
            sizer.size -= amt;
          }
        }
      }
      // Distribute any remaining space evenly among the non-stretchable
      // sizers. This progresses in phases in the same manner as above.
      while (notDoneCount > 0 && freeSpace > nearZero) {
        let amt = freeSpace / notDoneCount;
        for (let i = 0; i < count; ++i) {
          let sizer = sizers[i];
          if (sizer.done) {
            continue;
          }
          if (sizer.size - amt <= sizer.minSize) {
            freeSpace -= sizer.size - sizer.minSize;
            sizer.size = sizer.minSize;
            sizer.done = true;
            notDoneCount--;
          } else {
            freeSpace -= amt;
            sizer.size -= amt;
          }
        }
      }
    }
    // Distribute positive delta space.
    else {
      // Expand each stretchable sizer by an amount proportional to its
      // stretch factor. If a sizer reaches its max size it's marked as
      // done. The loop progresses in phases where each sizer is given
      // a chance to consume its fair share for the pass, regardless of
      // whether a sizer before it reached its limit. This continues
      // until the stretchable sizers or the free space is exhausted.
      let freeSpace = space - totalSize;
      while (stretchCount > 0 && freeSpace > nearZero) {
        let distSpace = freeSpace;
        let distStretch = totalStretch;
        for (let i = 0; i < count; ++i) {
          let sizer = sizers[i];
          if (sizer.done || sizer.stretch === 0) {
            continue;
          }
          let amt = (sizer.stretch * distSpace) / distStretch;
          if (sizer.size + amt >= sizer.maxSize) {
            freeSpace -= sizer.maxSize - sizer.size;
            totalStretch -= sizer.stretch;
            sizer.size = sizer.maxSize;
            sizer.done = true;
            notDoneCount--;
            stretchCount--;
          } else {
            freeSpace -= amt;
            sizer.size += amt;
          }
        }
      }
      // Distribute any remaining space evenly among the non-stretchable
      // sizers. This progresses in phases in the same manner as above.
      while (notDoneCount > 0 && freeSpace > nearZero) {
        let amt = freeSpace / notDoneCount;
        for (let i = 0; i < count; ++i) {
          let sizer = sizers[i];
          if (sizer.done) {
            continue;
          }
          if (sizer.size + amt >= sizer.maxSize) {
            freeSpace -= sizer.maxSize - sizer.size;
            sizer.size = sizer.maxSize;
            sizer.done = true;
            notDoneCount--;
          } else {
            freeSpace -= amt;
            sizer.size += amt;
          }
        }
      }
    }

    // Indicate that the consumed space equals the available space.
    return 0;
  }

  /**
   * Adjust a sizer by a delta and update its neighbors accordingly.
   *
   * @param sizers - The sizers which should be adjusted.
   *
   * @param index - The index of the sizer to grow.
   *
   * @param delta - The amount to adjust the sizer, positive or negative.
   *
   * #### Notes
   * This will adjust the indicated sizer by the specified amount, along
   * with the sizes of the appropriate neighbors, subject to the limits
   * specified by each of the sizers.
   *
   * This is useful when implementing box layouts where the boundaries
   * between the sizers are interactively adjustable by the user.
   */
  export function adjust(
    sizers: ArrayLike<BoxSizer>,
    index: number,
    delta: number
  ): void {
    // Bail early when there is nothing to do.
    if (sizers.length === 0 || delta === 0) {
      return;
    }

    // Dispatch to the proper implementation.
    if (delta > 0) {
      growSizer(sizers, index, delta);
    } else {
      shrinkSizer(sizers, index, -delta);
    }
  }

  /**
   * Grow a sizer by a positive delta and adjust neighbors.
   */
  function growSizer(
    sizers: ArrayLike<BoxSizer>,
    index: number,
    delta: number
  ): void {
    // Compute how much the items to the left can expand.
    let growLimit = 0;
    for (let i = 0; i <= index; ++i) {
      let sizer = sizers[i];
      growLimit += sizer.maxSize - sizer.size;
    }

    // Compute how much the items to the right can shrink.
    let shrinkLimit = 0;
    for (let i = index + 1, n = sizers.length; i < n; ++i) {
      let sizer = sizers[i];
      shrinkLimit += sizer.size - sizer.minSize;
    }

    // Clamp the delta adjustment to the limits.
    delta = Math.min(delta, growLimit, shrinkLimit);

    // Grow the sizers to the left by the delta.
    let grow = delta;
    for (let i = index; i >= 0 && grow > 0; --i) {
      let sizer = sizers[i];
      let limit = sizer.maxSize - sizer.size;
      if (limit >= grow) {
        sizer.sizeHint = sizer.size + grow;
        grow = 0;
      } else {
        sizer.sizeHint = sizer.size + limit;
        grow -= limit;
      }
    }

    // Shrink the sizers to the right by the delta.
    let shrink = delta;
    for (let i = index + 1, n = sizers.length; i < n && shrink > 0; ++i) {
      let sizer = sizers[i];
      let limit = sizer.size - sizer.minSize;
      if (limit >= shrink) {
        sizer.sizeHint = sizer.size - shrink;
        shrink = 0;
      } else {
        sizer.sizeHint = sizer.size - limit;
        shrink -= limit;
      }
    }
  }

  /**
   * Shrink a sizer by a positive delta and adjust neighbors.
   */
  function shrinkSizer(
    sizers: ArrayLike<BoxSizer>,
    index: number,
    delta: number
  ): void {
    // Compute how much the items to the right can expand.
    let growLimit = 0;
    for (let i = index + 1, n = sizers.length; i < n; ++i) {
      let sizer = sizers[i];
      growLimit += sizer.maxSize - sizer.size;
    }

    // Compute how much the items to the left can shrink.
    let shrinkLimit = 0;
    for (let i = 0; i <= index; ++i) {
      let sizer = sizers[i];
      shrinkLimit += sizer.size - sizer.minSize;
    }

    // Clamp the delta adjustment to the limits.
    delta = Math.min(delta, growLimit, shrinkLimit);

    // Grow the sizers to the right by the delta.
    let grow = delta;
    for (let i = index + 1, n = sizers.length; i < n && grow > 0; ++i) {
      let sizer = sizers[i];
      let limit = sizer.maxSize - sizer.size;
      if (limit >= grow) {
        sizer.sizeHint = sizer.size + grow;
        grow = 0;
      } else {
        sizer.sizeHint = sizer.size + limit;
        grow -= limit;
      }
    }

    // Shrink the sizers to the left by the delta.
    let shrink = delta;
    for (let i = index; i >= 0 && shrink > 0; --i) {
      let sizer = sizers[i];
      let limit = sizer.size - sizer.minSize;
      if (limit >= shrink) {
        sizer.sizeHint = sizer.size - shrink;
        shrink = 0;
      } else {
        sizer.sizeHint = sizer.size - limit;
        shrink -= limit;
      }
    }
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { ElementExt } from '@lumino/domutils';

import { Message, MessageLoop } from '@lumino/messaging';

import { AttachedProperty } from '@lumino/properties';

import { BoxEngine, BoxSizer } from './boxengine';

import { LayoutItem } from './layout';

import { PanelLayout } from './panellayout';

import Utils from './utils';

import { Widget } from './widget';

/**
 * A layout which arranges its widgets in a single row or column.
 */
export class BoxLayout extends PanelLayout {
  /**
   * Construct a new box layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: BoxLayout.IOptions = {}) {
    super();
    if (options.direction !== undefined) {
      this._direction = options.direction;
    }
    if (options.alignment !== undefined) {
      this._alignment = options.alignment;
    }
    if (options.spacing !== undefined) {
      this._spacing = Utils.clampDimension(options.spacing);
    }
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    // Dispose of the layout items.
    for (const item of this._items) {
      item.dispose();
    }

    // Clear the layout state.
    this._box = null;
    this._items.length = 0;
    this._sizers.length = 0;

    // Dispose of the rest of the layout.
    super.dispose();
  }

  /**
   * Get the layout direction for the box layout.
   */
  get direction(): BoxLayout.Direction {
    return this._direction;
  }

  /**
   * Set the layout direction for the box layout.
   */
  set direction(value: BoxLayout.Direction) {
    if (this._direction === value) {
      return;
    }
    this._direction = value;
    if (!this.parent) {
      return;
    }
    this.parent.dataset['direction'] = value;
    this.parent.fit();
  }

  /**
   * Get the content alignment for the box layout.
   *
   * #### Notes
   * This is the alignment of the widgets in the layout direction.
   *
   * The alignment has no effect if the widgets can expand to fill the
   * entire box layout.
   */
  get alignment(): BoxLayout.Alignment {
    return this._alignment;
  }

  /**
   * Set the content alignment for the box layout.
   *
   * #### Notes
   * This is the alignment of the widgets in the layout direction.
   *
   * The alignment has no effect if the widgets can expand to fill the
   * entire box layout.
   */
  set alignment(value: BoxLayout.Alignment) {
    if (this._alignment === value) {
      return;
    }
    this._alignment = value;
    if (!this.parent) {
      return;
    }
    this.parent.dataset['alignment'] = value;
    this.parent.update();
  }

  /**
   * Get the inter-element spacing for the box layout.
   */
  get spacing(): number {
    return this._spacing;
  }

  /**
   * Set the inter-element spacing for the box layout.
   */
  set spacing(value: number) {
    value = Utils.clampDimension(value);
    if (this._spacing === value) {
      return;
    }
    this._spacing = value;
    if (!this.parent) {
      return;
    }
    this.parent.fit();
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    this.parent!.dataset['direction'] = this.direction;
    this.parent!.dataset['alignment'] = this.alignment;
    super.init();
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param index - The current index of the widget in the layout.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected attachWidget(index: number, widget: Widget): void {
    // Create and add a new layout item for the widget.
    ArrayExt.insert(this._items, index, new LayoutItem(widget));

    // Create and add a new sizer for the widget.
    ArrayExt.insert(this._sizers, index, new BoxSizer());

    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget's node to the parent.
    this.parent!.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * Move a widget in the parent's DOM node.
   *
   * @param fromIndex - The previous index of the widget in the layout.
   *
   * @param toIndex - The current index of the widget in the layout.
   *
   * @param widget - The widget to move in the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    // Move the layout item for the widget.
    ArrayExt.move(this._items, fromIndex, toIndex);

    // Move the sizer for the widget.
    ArrayExt.move(this._sizers, fromIndex, toIndex);

    // Post an update request for the parent widget.
    this.parent!.update();
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param index - The previous index of the widget in the layout.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected detachWidget(index: number, widget: Widget): void {
    // Remove the layout item for the widget.
    let item = ArrayExt.removeAt(this._items, index);

    // Remove the sizer for the widget.
    ArrayExt.removeAt(this._sizers, index);

    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }

    // Dispose of the layout item.
    item!.dispose();

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg);
    this.parent!.update();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height);
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1);
    }
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit();
    }
  }

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Compute the visible item count.
    let nVisible = 0;
    for (let i = 0, n = this._items.length; i < n; ++i) {
      nVisible += +!this._items[i].isHidden;
    }

    // Update the fixed space for the visible items.
    this._fixed = this._spacing * Math.max(0, nVisible - 1);

    // Setup the computed minimum size.
    let horz = Private.isHorizontal(this._direction);
    let minW = horz ? this._fixed : 0;
    let minH = horz ? 0 : this._fixed;

    // Update the sizers and computed minimum size.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item and corresponding box sizer.
      let item = this._items[i];
      let sizer = this._sizers[i];

      // If the item is hidden, it should consume zero size.
      if (item.isHidden) {
        sizer.minSize = 0;
        sizer.maxSize = 0;
        continue;
      }

      // Update the size limits for the item.
      item.fit();

      // Update the size basis and stretch factor.
      sizer.sizeHint = BoxLayout.getSizeBasis(item.widget);
      sizer.stretch = BoxLayout.getStretch(item.widget);

      // Update the sizer limits and computed min size.
      if (horz) {
        sizer.minSize = item.minWidth;
        sizer.maxSize = item.maxWidth;
        minW += item.minWidth;
        minH = Math.max(minH, item.minHeight);
      } else {
        sizer.minSize = item.minHeight;
        sizer.maxSize = item.maxHeight;
        minH += item.minHeight;
        minW = Math.max(minW, item.minWidth);
      }
    }

    // Update the box sizing and add it to the computed min size.
    let box = (this._box = ElementExt.boxSizing(this.parent!.node));
    minW += box.horizontalSum;
    minH += box.verticalSum;

    // Update the parent's min size constraints.
    let style = this.parent!.node.style;
    style.minWidth = `${minW}px`;
    style.minHeight = `${minH}px`;

    // Set the dirty flag to ensure only a single update occurs.
    this._dirty = true;

    // Notify the ancestor that it should fit immediately. This may
    // cause a resize of the parent, fulfilling the required update.
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest);
    }

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
    }
  }

  /**
   * Update the layout position and size of the widgets.
   *
   * The parent offset dimensions should be `-1` if unknown.
   */
  private _update(offsetWidth: number, offsetHeight: number): void {
    // Clear the dirty flag to indicate the update occurred.
    this._dirty = false;

    // Compute the visible item count.
    let nVisible = 0;
    for (let i = 0, n = this._items.length; i < n; ++i) {
      nVisible += +!this._items[i].isHidden;
    }

    // Bail early if there are no visible items to layout.
    if (nVisible === 0) {
      return;
    }

    // Measure the parent if the offset dimensions are unknown.
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth;
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight;
    }

    // Ensure the parent box sizing data is computed.
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node);
    }

    // Compute the layout area adjusted for border and padding.
    let top = this._box.paddingTop;
    let left = this._box.paddingLeft;
    let width = offsetWidth - this._box.horizontalSum;
    let height = offsetHeight - this._box.verticalSum;

    // Distribute the layout space and adjust the start position.
    let delta: number;
    switch (this._direction) {
      case 'left-to-right':
        delta = BoxEngine.calc(this._sizers, Math.max(0, width - this._fixed));
        break;
      case 'top-to-bottom':
        delta = BoxEngine.calc(this._sizers, Math.max(0, height - this._fixed));
        break;
      case 'right-to-left':
        delta = BoxEngine.calc(this._sizers, Math.max(0, width - this._fixed));
        left += width;
        break;
      case 'bottom-to-top':
        delta = BoxEngine.calc(this._sizers, Math.max(0, height - this._fixed));
        top += height;
        break;
      default:
        throw 'unreachable';
    }

    // Setup the variables for justification and alignment offset.
    let extra = 0;
    let offset = 0;

    // Account for alignment if there is extra layout space.
    if (delta > 0) {
      switch (this._alignment) {
        case 'start':
          break;
        case 'center':
          extra = 0;
          offset = delta / 2;
          break;
        case 'end':
          extra = 0;
          offset = delta;
          break;
        case 'justify':
          extra = delta / nVisible;
          offset = 0;
          break;
        default:
          throw 'unreachable';
      }
    }

    // Layout the items using the computed box sizes.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item.
      let item = this._items[i];

      // Ignore hidden items.
      if (item.isHidden) {
        continue;
      }

      // Fetch the computed size for the widget.
      let size = this._sizers[i].size;

      // Update the widget geometry and advance the relevant edge.
      switch (this._direction) {
        case 'left-to-right':
          item.update(left + offset, top, size + extra, height);
          left += size + extra + this._spacing;
          break;
        case 'top-to-bottom':
          item.update(left, top + offset, width, size + extra);
          top += size + extra + this._spacing;
          break;
        case 'right-to-left':
          item.update(left - offset - size - extra, top, size + extra, height);
          left -= size + extra + this._spacing;
          break;
        case 'bottom-to-top':
          item.update(left, top - offset - size - extra, width, size + extra);
          top -= size + extra + this._spacing;
          break;
        default:
          throw 'unreachable';
      }
    }
  }

  private _fixed = 0;
  private _spacing = 4;
  private _dirty = false;
  private _sizers: BoxSizer[] = [];
  private _items: LayoutItem[] = [];
  private _box: ElementExt.IBoxSizing | null = null;
  private _alignment: BoxLayout.Alignment = 'start';
  private _direction: BoxLayout.Direction = 'top-to-bottom';
}

/**
 * The namespace for the `BoxLayout` class statics.
 */
export namespace BoxLayout {
  /**
   * A type alias for a box layout direction.
   */
  export type Direction =
    | 'left-to-right'
    | 'right-to-left'
    | 'top-to-bottom'
    | 'bottom-to-top';

  /**
   * A type alias for a box layout alignment.
   */
  export type Alignment = 'start' | 'center' | 'end' | 'justify';

  /**
   * An options object for initializing a box layout.
   */
  export interface IOptions {
    /**
     * The direction of the layout.
     *
     * The default is `'top-to-bottom'`.
     */
    direction?: Direction;

    /**
     * The content alignment of the layout.
     *
     * The default is `'start'`.
     */
    alignment?: Alignment;

    /**
     * The spacing between items in the layout.
     *
     * The default is `4`.
     */
    spacing?: number;
  }

  /**
   * Get the box layout stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The box layout stretch factor for the widget.
   */
  export function getStretch(widget: Widget): number {
    return Private.stretchProperty.get(widget);
  }

  /**
   * Set the box layout stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the stretch factor.
   */
  export function setStretch(widget: Widget, value: number): void {
    Private.stretchProperty.set(widget, value);
  }

  /**
   * Get the box layout size basis for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The box layout size basis for the widget.
   */
  export function getSizeBasis(widget: Widget): number {
    return Private.sizeBasisProperty.get(widget);
  }

  /**
   * Set the box layout size basis for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the size basis.
   */
  export function setSizeBasis(widget: Widget, value: number): void {
    Private.sizeBasisProperty.set(widget, value);
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The property descriptor for a widget stretch factor.
   */
  export const stretchProperty = new AttachedProperty<Widget, number>({
    name: 'stretch',
    create: () => 0,
    coerce: (owner, value) => Math.max(0, Math.floor(value)),
    changed: onChildSizingChanged
  });

  /**
   * The property descriptor for a widget size basis.
   */
  export const sizeBasisProperty = new AttachedProperty<Widget, number>({
    name: 'sizeBasis',
    create: () => 0,
    coerce: (owner, value) => Math.max(0, Math.floor(value)),
    changed: onChildSizingChanged
  });

  /**
   * Test whether a direction has horizontal orientation.
   */
  export function isHorizontal(dir: BoxLayout.Direction): boolean {
    return dir === 'left-to-right' || dir === 'right-to-left';
  }

  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }

  /**
   * The change handler for the attached sizing properties.
   */
  function onChildSizingChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof BoxLayout) {
      child.parent.fit();
    }
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { BoxLayout } from './boxlayout';

import { Panel } from './panel';

import { Widget } from './widget';

/**
 * A panel which arranges its widgets in a single row or column.
 *
 * #### Notes
 * This class provides a convenience wrapper around a [[BoxLayout]].
 */
export class BoxPanel extends Panel {
  /**
   * Construct a new box panel.
   *
   * @param options - The options for initializing the box panel.
   */
  constructor(options: BoxPanel.IOptions = {}) {
    super({ layout: Private.createLayout(options) });
    this.addClass('lm-BoxPanel');
  }

  /**
   * Get the layout direction for the box panel.
   */
  get direction(): BoxPanel.Direction {
    return (this.layout as BoxLayout).direction;
  }

  /**
   * Set the layout direction for the box panel.
   */
  set direction(value: BoxPanel.Direction) {
    (this.layout as BoxLayout).direction = value;
  }

  /**
   * Get the content alignment for the box panel.
   *
   * #### Notes
   * This is the alignment of the widgets in the layout direction.
   *
   * The alignment has no effect if the widgets can expand to fill the
   * entire box layout.
   */
  get alignment(): BoxPanel.Alignment {
    return (this.layout as BoxLayout).alignment;
  }

  /**
   * Set the content alignment for the box panel.
   *
   * #### Notes
   * This is the alignment of the widgets in the layout direction.
   *
   * The alignment has no effect if the widgets can expand to fill the
   * entire box layout.
   */
  set alignment(value: BoxPanel.Alignment) {
    (this.layout as BoxLayout).alignment = value;
  }

  /**
   * Get the inter-element spacing for the box panel.
   */
  get spacing(): number {
    return (this.layout as BoxLayout).spacing;
  }

  /**
   * Set the inter-element spacing for the box panel.
   */
  set spacing(value: number) {
    (this.layout as BoxLayout).spacing = value;
  }

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: Widget.ChildMessage): void {
    msg.child.addClass('lm-BoxPanel-child');
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    msg.child.removeClass('lm-BoxPanel-child');
  }
}

/**
 * The namespace for the `BoxPanel` class statics.
 */
export namespace BoxPanel {
  /**
   * A type alias for a box panel direction.
   */
  export type Direction = BoxLayout.Direction;

  /**
   * A type alias for a box panel alignment.
   */
  export type Alignment = BoxLayout.Alignment;

  /**
   * An options object for initializing a box panel.
   */
  export interface IOptions {
    /**
     * The layout direction of the panel.
     *
     * The default is `'top-to-bottom'`.
     */
    direction?: Direction;

    /**
     * The content alignment of the panel.
     *
     * The default is `'start'`.
     */
    alignment?: Alignment;

    /**
     * The spacing between items in the panel.
     *
     * The default is `4`.
     */
    spacing?: number;

    /**
     * The box layout to use for the box panel.
     *
     * If this is provided, the other options are ignored.
     *
     * The default is a new `BoxLayout`.
     */
    layout?: BoxLayout;
  }

  /**
   * Get the box panel stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The box panel stretch factor for the widget.
   */
  export function getStretch(widget: Widget): number {
    return BoxLayout.getStretch(widget);
  }

  /**
   * Set the box panel stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the stretch factor.
   */
  export function setStretch(widget: Widget, value: number): void {
    BoxLayout.setStretch(widget, value);
  }

  /**
   * Get the box panel size basis for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The box panel size basis for the widget.
   */
  export function getSizeBasis(widget: Widget): number {
    return BoxLayout.getSizeBasis(widget);
  }

  /**
   * Set the box panel size basis for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the size basis.
   */
  export function setSizeBasis(widget: Widget, value: number): void {
    BoxLayout.setSizeBasis(widget, value);
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create a box layout for the given panel options.
   */
  export function createLayout(options: BoxPanel.IOptions): BoxLayout {
    return options.layout || new BoxLayout(options);
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt, StringExt } from '@lumino/algorithm';

import { JSONExt, ReadonlyJSONObject } from '@lumino/coreutils';

import { CommandRegistry } from '@lumino/commands';

import { ElementExt } from '@lumino/domutils';

import { Message } from '@lumino/messaging';

import {
  ElementDataset,
  h,
  VirtualDOM,
  VirtualElement
} from '@lumino/virtualdom';

import { Widget } from './widget';

/**
 * A widget which displays command items as a searchable palette.
 */
export class CommandPalette extends Widget {
  /**
   * Construct a new command palette.
   *
   * @param options - The options for initializing the palette.
   */
  constructor(options: CommandPalette.IOptions) {
    super({ node: Private.createNode() });
    this.addClass('lm-CommandPalette');
    this.setFlag(Widget.Flag.DisallowLayout);
    this.commands = options.commands;
    this.renderer = options.renderer || CommandPalette.defaultRenderer;
    this.commands.commandChanged.connect(this._onGenericChange, this);
    this.commands.keyBindingChanged.connect(this._onGenericChange, this);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._items.length = 0;
    this._results = null;
    super.dispose();
  }

  /**
   * The command registry used by the command palette.
   */
  readonly commands: CommandRegistry;

  /**
   * The renderer used by the command palette.
   */
  readonly renderer: CommandPalette.IRenderer;

  /**
   * The command palette search node.
   *
   * #### Notes
   * This is the node which contains the search-related elements.
   */
  get searchNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      'lm-CommandPalette-search'
    )[0] as HTMLDivElement;
  }

  /**
   * The command palette input node.
   *
   * #### Notes
   * This is the actual input node for the search area.
   */
  get inputNode(): HTMLInputElement {
    return this.node.getElementsByClassName(
      'lm-CommandPalette-input'
    )[0] as HTMLInputElement;
  }

  /**
   * The command palette content node.
   *
   * #### Notes
   * This is the node which holds the command item nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(
      'lm-CommandPalette-content'
    )[0] as HTMLUListElement;
  }

  /**
   * A read-only array of the command items in the palette.
   */
  get items(): ReadonlyArray<CommandPalette.IItem> {
    return this._items;
  }

  /**
   * Add a command item to the command palette.
   *
   * @param options - The options for creating the command item.
   *
   * @returns The command item added to the palette.
   */
  addItem(options: CommandPalette.IItemOptions): CommandPalette.IItem {
    // Create a new command item for the options.
    let item = Private.createItem(this.commands, options);

    // Add the item to the array.
    this._items.push(item);

    // Refresh the search results.
    this.refresh();

    // Return the item added to the palette.
    return item;
  }

  /**
   * Adds command items to the command palette.
   *
   * @param items - An array of options for creating each command item.
   *
   * @returns The command items added to the palette.
   */
  addItems(items: CommandPalette.IItemOptions[]): CommandPalette.IItem[] {
    const newItems = items.map(item => Private.createItem(this.commands, item));
    newItems.forEach(item => this._items.push(item));
    this.refresh();
    return newItems;
  }

  /**
   * Remove an item from the command palette.
   *
   * @param item - The item to remove from the palette.
   *
   * #### Notes
   * This is a no-op if the item is not in the palette.
   */
  removeItem(item: CommandPalette.IItem): void {
    this.removeItemAt(this._items.indexOf(item));
  }

  /**
   * Remove the item at a given index from the command palette.
   *
   * @param index - The index of the item to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeItemAt(index: number): void {
    // Remove the item from the array.
    let item = ArrayExt.removeAt(this._items, index);

    // Bail if the index is out of range.
    if (!item) {
      return;
    }

    // Refresh the search results.
    this.refresh();
  }

  /**
   * Remove all items from the command palette.
   */
  clearItems(): void {
    // Bail if there is nothing to remove.
    if (this._items.length === 0) {
      return;
    }

    // Clear the array of items.
    this._items.length = 0;

    // Refresh the search results.
    this.refresh();
  }

  /**
   * Clear the search results and schedule an update.
   *
   * #### Notes
   * This should be called whenever the search results of the palette
   * should be updated.
   *
   * This is typically called automatically by the palette as needed,
   * but can be called manually if the input text is programatically
   * changed.
   *
   * The rendered results are updated asynchronously.
   */
  refresh(): void {
    this._results = null;
    if (this.inputNode.value !== '') {
      let clear = this.node.getElementsByClassName(
        'lm-close-icon'
      )[0] as HTMLInputElement;
      clear.style.display = 'inherit';
    } else {
      let clear = this.node.getElementsByClassName(
        'lm-close-icon'
      )[0] as HTMLInputElement;
      clear.style.display = 'none';
    }
    this.update();
  }

  /**
   * Handle the DOM events for the command palette.
   *
   * @param event - The DOM event sent to the command palette.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the command palette's DOM node.
   * It should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'click':
        this._evtClick(event as MouseEvent);
        break;
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
      case 'input':
        this.refresh();
        break;
      case 'focus':
      case 'blur':
        this._toggleFocused();
        break;
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('click', this);
    this.node.addEventListener('keydown', this);
    this.node.addEventListener('input', this);
    this.node.addEventListener('focus', this, true);
    this.node.addEventListener('blur', this, true);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('keydown', this);
    this.node.removeEventListener('input', this);
    this.node.removeEventListener('focus', this, true);
    this.node.removeEventListener('blur', this, true);
  }

  /**
   * A message handler invoked on an `'activate-request'` message.
   */
  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      let input = this.inputNode;
      input.focus();
      input.select();
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Fetch the current query text and content node.
    let query = this.inputNode.value;
    let contentNode = this.contentNode;

    // Ensure the search results are generated.
    let results = this._results;
    if (!results) {
      // Generate and store the new search results.
      results = this._results = Private.search(this._items, query);

      // Reset the active index.
      this._activeIndex = query
        ? ArrayExt.findFirstIndex(results, Private.canActivate)
        : -1;
    }

    // If there is no query and no results, clear the content.
    if (!query && results.length === 0) {
      VirtualDOM.render(null, contentNode);
      return;
    }

    // If the is a query but no results, render the empty message.
    if (query && results.length === 0) {
      let content = this.renderer.renderEmptyMessage({ query });
      VirtualDOM.render(content, contentNode);
      return;
    }

    // Create the render content for the search results.
    let renderer = this.renderer;
    let activeIndex = this._activeIndex;
    let content = new Array<VirtualElement>(results.length);
    for (let i = 0, n = results.length; i < n; ++i) {
      let result = results[i];
      if (result.type === 'header') {
        let indices = result.indices;
        let category = result.category;
        content[i] = renderer.renderHeader({ category, indices });
      } else {
        let item = result.item;
        let indices = result.indices;
        let active = i === activeIndex;
        content[i] = renderer.renderItem({ item, indices, active });
      }
    }

    // Render the search result content.
    VirtualDOM.render(content, contentNode);

    // Adjust the scroll position as needed.
    if (activeIndex < 0 || activeIndex >= results.length) {
      contentNode.scrollTop = 0;
    } else {
      let element = contentNode.children[activeIndex];
      ElementExt.scrollIntoViewIfNeeded(contentNode, element);
    }
  }

  /**
   * Handle the `'click'` event for the command palette.
   */
  private _evtClick(event: MouseEvent): void {
    // Bail if the click is not the left button.
    if (event.button !== 0) {
      return;
    }

    // Clear input if the target is clear button
    if ((event.target as HTMLElement).classList.contains('lm-close-icon')) {
      this.inputNode.value = '';
      this.refresh();
      return;
    }

    // Find the index of the item which was clicked.
    let index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return node.contains(event.target as HTMLElement);
    });

    // Bail if the click was not on an item.
    if (index === -1) {
      return;
    }

    // Kill the event when a content item is clicked.
    event.preventDefault();
    event.stopPropagation();

    // Execute the item if possible.
    this._execute(index);
  }

  /**
   * Handle the `'keydown'` event for the command palette.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    switch (event.keyCode) {
      case 13: // Enter
        event.preventDefault();
        event.stopPropagation();
        this._execute(this._activeIndex);
        break;
      case 38: // Up Arrow
        event.preventDefault();
        event.stopPropagation();
        this._activatePreviousItem();
        break;
      case 40: // Down Arrow
        event.preventDefault();
        event.stopPropagation();
        this._activateNextItem();
        break;
    }
  }

  /**
   * Activate the next enabled command item.
   */
  private _activateNextItem(): void {
    // Bail if there are no search results.
    if (!this._results || this._results.length === 0) {
      return;
    }

    // Find the next enabled item index.
    let ai = this._activeIndex;
    let n = this._results.length;
    let start = ai < n - 1 ? ai + 1 : 0;
    let stop = start === 0 ? n - 1 : start - 1;
    this._activeIndex = ArrayExt.findFirstIndex(
      this._results,
      Private.canActivate,
      start,
      stop
    );

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Activate the previous enabled command item.
   */
  private _activatePreviousItem(): void {
    // Bail if there are no search results.
    if (!this._results || this._results.length === 0) {
      return;
    }

    // Find the previous enabled item index.
    let ai = this._activeIndex;
    let n = this._results.length;
    let start = ai <= 0 ? n - 1 : ai - 1;
    let stop = start === n - 1 ? 0 : start + 1;
    this._activeIndex = ArrayExt.findLastIndex(
      this._results,
      Private.canActivate,
      start,
      stop
    );

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Execute the command item at the given index, if possible.
   */
  private _execute(index: number): void {
    // Bail if there are no search results.
    if (!this._results) {
      return;
    }

    // Bail if the index is out of range.
    let part = this._results[index];
    if (!part) {
      return;
    }

    // Update the search text if the item is a header.
    if (part.type === 'header') {
      let input = this.inputNode;
      input.value = `${part.category.toLowerCase()} `;
      input.focus();
      this.refresh();
      return;
    }

    // Bail if item is not enabled.
    if (!part.item.isEnabled) {
      return;
    }

    // Execute the item.
    this.commands.execute(part.item.command, part.item.args);

    // Clear the query text.
    this.inputNode.value = '';

    // Refresh the search results.
    this.refresh();
  }

  /**
   * Toggle the focused modifier based on the input node focus state.
   */
  private _toggleFocused(): void {
    let focused = document.activeElement === this.inputNode;
    this.toggleClass('lm-mod-focused', focused);
  }

  /**
   * A signal handler for generic command changes.
   */
  private _onGenericChange(): void {
    this.refresh();
  }

  private _activeIndex = -1;
  private _items: CommandPalette.IItem[] = [];
  private _results: Private.SearchResult[] | null = null;
}

/**
 * The namespace for the `CommandPalette` class statics.
 */
export namespace CommandPalette {
  /**
   * An options object for creating a command palette.
   */
  export interface IOptions {
    /**
     * The command registry for use with the command palette.
     */
    commands: CommandRegistry;

    /**
     * A custom renderer for use with the command palette.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
  }

  /**
   * An options object for creating a command item.
   */
  export interface IItemOptions {
    /**
     * The category for the item.
     */
    category: string;

    /**
     * The command to execute when the item is triggered.
     */
    command: string;

    /**
     * The arguments for the command.
     *
     * The default value is an empty object.
     */
    args?: ReadonlyJSONObject;

    /**
     * The rank for the command item.
     *
     * The rank is used as a tie-breaker when ordering command items
     * for display. Items are sorted in the following order:
     *   1. Text match (lower is better)
     *   2. Category (locale order)
     *   3. Rank (lower is better)
     *   4. Label (locale order)
     *
     * The default rank is `Infinity`.
     */
    rank?: number;
  }

  /**
   * An object which represents an item in a command palette.
   *
   * #### Notes
   * Item objects are created automatically by a command palette.
   */
  export interface IItem {
    /**
     * The command to execute when the item is triggered.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: ReadonlyJSONObject;

    /**
     * The category for the command item.
     */
    readonly category: string;

    /**
     * The rank for the command item.
     */
    readonly rank: number;

    /**
     * The display label for the command item.
     */
    readonly label: string;

    /**
     * The display caption for the command item.
     */
    readonly caption: string;

    /**
     * The icon renderer for the command item.
     */
    readonly icon: VirtualElement.IRenderer | undefined;

    /**
     * The icon class for the command item.
     */
    readonly iconClass: string;

    /**
     * The icon label for the command item.
     */
    readonly iconLabel: string;

    /**
     * The extra class name for the command item.
     */
    readonly className: string;

    /**
     * The dataset for the command item.
     */
    readonly dataset: CommandRegistry.Dataset;

    /**
     * Whether the command item is enabled.
     */
    readonly isEnabled: boolean;

    /**
     * Whether the command item is toggled.
     */
    readonly isToggled: boolean;

    /**
     * Whether the command item is toggleable.
     */
    readonly isToggleable: boolean;

    /**
     * Whether the command item is visible.
     */
    readonly isVisible: boolean;

    /**
     * The key binding for the command item.
     */
    readonly keyBinding: CommandRegistry.IKeyBinding | null;
  }

  /**
   * The render data for a command palette header.
   */
  export interface IHeaderRenderData {
    /**
     * The category of the header.
     */
    readonly category: string;

    /**
     * The indices of the matched characters in the category.
     */
    readonly indices: ReadonlyArray<number> | null;
  }

  /**
   * The render data for a command palette item.
   */
  export interface IItemRenderData {
    /**
     * The command palette item to render.
     */
    readonly item: IItem;

    /**
     * The indices of the matched characters in the label.
     */
    readonly indices: ReadonlyArray<number> | null;

    /**
     * Whether the item is the active item.
     */
    readonly active: boolean;
  }

  /**
   * The render data for a command palette empty message.
   */
  export interface IEmptyMessageRenderData {
    /**
     * The query which failed to match any commands.
     */
    query: string;
  }

  /**
   * A renderer for use with a command palette.
   */
  export interface IRenderer {
    /**
     * Render the virtual element for a command palette header.
     *
     * @param data - The data to use for rendering the header.
     *
     * @returns A virtual element representing the header.
     */
    renderHeader(data: IHeaderRenderData): VirtualElement;

    /**
     * Render the virtual element for a command palette item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     *
     * #### Notes
     * The command palette will not render invisible items.
     */
    renderItem(data: IItemRenderData): VirtualElement;

    /**
     * Render the empty results message for a command palette.
     *
     * @param data - The data to use for rendering the message.
     *
     * @returns A virtual element representing the message.
     */
    renderEmptyMessage(data: IEmptyMessageRenderData): VirtualElement;
  }

  /**
   * The default implementation of `IRenderer`.
   */
  export class Renderer implements IRenderer {
    /**
     * Render the virtual element for a command palette header.
     *
     * @param data - The data to use for rendering the header.
     *
     * @returns A virtual element representing the header.
     */
    renderHeader(data: IHeaderRenderData): VirtualElement {
      let content = this.formatHeader(data);
      return h.li({ className: 'lm-CommandPalette-header' }, content);
    }

    /**
     * Render the virtual element for a command palette item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IItemRenderData): VirtualElement {
      let className = this.createItemClass(data);
      let dataset = this.createItemDataset(data);
      if (data.item.isToggleable) {
        return h.li(
          {
            className,
            dataset,
            role: 'checkbox',
            'aria-checked': `${data.item.isToggled}`
          },
          this.renderItemIcon(data),
          this.renderItemContent(data),
          this.renderItemShortcut(data)
        );
      }
      return h.li(
        {
          className,
          dataset
        },
        this.renderItemIcon(data),
        this.renderItemContent(data),
        this.renderItemShortcut(data)
      );
    }

    /**
     * Render the empty results message for a command palette.
     *
     * @param data - The data to use for rendering the message.
     *
     * @returns A virtual element representing the message.
     */
    renderEmptyMessage(data: IEmptyMessageRenderData): VirtualElement {
      let content = this.formatEmptyMessage(data);
      return h.li({ className: 'lm-CommandPalette-emptyMessage' }, content);
    }

    /**
     * Render the icon for a command palette item.
     *
     * @param data - The data to use for rendering the icon.
     *
     * @returns A virtual element representing the icon.
     */
    renderItemIcon(data: IItemRenderData): VirtualElement {
      let className = this.createIconClass(data);

      // If data.item.icon is undefined, it will be ignored.
      return h.div({ className }, data.item.icon!, data.item.iconLabel);
    }

    /**
     * Render the content for a command palette item.
     *
     * @param data - The data to use for rendering the content.
     *
     * @returns A virtual element representing the content.
     */
    renderItemContent(data: IItemRenderData): VirtualElement {
      return h.div(
        { className: 'lm-CommandPalette-itemContent' },
        this.renderItemLabel(data),
        this.renderItemCaption(data)
      );
    }

    /**
     * Render the label for a command palette item.
     *
     * @param data - The data to use for rendering the label.
     *
     * @returns A virtual element representing the label.
     */
    renderItemLabel(data: IItemRenderData): VirtualElement {
      let content = this.formatItemLabel(data);
      return h.div({ className: 'lm-CommandPalette-itemLabel' }, content);
    }

    /**
     * Render the caption for a command palette item.
     *
     * @param data - The data to use for rendering the caption.
     *
     * @returns A virtual element representing the caption.
     */
    renderItemCaption(data: IItemRenderData): VirtualElement {
      let content = this.formatItemCaption(data);
      return h.div({ className: 'lm-CommandPalette-itemCaption' }, content);
    }

    /**
     * Render the shortcut for a command palette item.
     *
     * @param data - The data to use for rendering the shortcut.
     *
     * @returns A virtual element representing the shortcut.
     */
    renderItemShortcut(data: IItemRenderData): VirtualElement {
      let content = this.formatItemShortcut(data);
      return h.div({ className: 'lm-CommandPalette-itemShortcut' }, content);
    }

    /**
     * Create the class name for the command palette item.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the command palette item.
     */
    createItemClass(data: IItemRenderData): string {
      // Set up the initial class name.
      let name = 'lm-CommandPalette-item';

      // Add the boolean state classes.
      if (!data.item.isEnabled) {
        name += ' lm-mod-disabled';
      }
      if (data.item.isToggled) {
        name += ' lm-mod-toggled';
      }
      if (data.active) {
        name += ' lm-mod-active';
      }

      // Add the extra class.
      let extra = data.item.className;
      if (extra) {
        name += ` ${extra}`;
      }

      // Return the complete class name.
      return name;
    }

    /**
     * Create the dataset for the command palette item.
     *
     * @param data - The data to use for creating the dataset.
     *
     * @returns The dataset for the command palette item.
     */
    createItemDataset(data: IItemRenderData): ElementDataset {
      return { ...data.item.dataset, command: data.item.command };
    }

    /**
     * Create the class name for the command item icon.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the item icon.
     */
    createIconClass(data: IItemRenderData): string {
      let name = 'lm-CommandPalette-itemIcon';
      let extra = data.item.iconClass;
      return extra ? `${name} ${extra}` : name;
    }

    /**
     * Create the render content for the header node.
     *
     * @param data - The data to use for the header content.
     *
     * @returns The content to add to the header node.
     */
    formatHeader(data: IHeaderRenderData): h.Child {
      if (!data.indices || data.indices.length === 0) {
        return data.category;
      }
      return StringExt.highlight(data.category, data.indices, h.mark);
    }

    /**
     * Create the render content for the empty message node.
     *
     * @param data - The data to use for the empty message content.
     *
     * @returns The content to add to the empty message node.
     */
    formatEmptyMessage(data: IEmptyMessageRenderData): h.Child {
      return `No commands found that match '${data.query}'`;
    }

    /**
     * Create the render content for the item shortcut node.
     *
     * @param data - The data to use for the shortcut content.
     *
     * @returns The content to add to the shortcut node.
     */
    formatItemShortcut(data: IItemRenderData): h.Child {
      let kb = data.item.keyBinding;
      return kb
        ? kb.keys.map(CommandRegistry.formatKeystroke).join(', ')
        : null;
    }

    /**
     * Create the render content for the item label node.
     *
     * @param data - The data to use for the label content.
     *
     * @returns The content to add to the label node.
     */
    formatItemLabel(data: IItemRenderData): h.Child {
      if (!data.indices || data.indices.length === 0) {
        return data.item.label;
      }
      return StringExt.highlight(data.item.label, data.indices, h.mark);
    }

    /**
     * Create the render content for the item caption node.
     *
     * @param data - The data to use for the caption content.
     *
     * @returns The content to add to the caption node.
     */
    formatItemCaption(data: IItemRenderData): h.Child {
      return data.item.caption;
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export const defaultRenderer = new Renderer();
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create the DOM node for a command palette.
   */
  export function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let search = document.createElement('div');
    let wrapper = document.createElement('div');
    let input = document.createElement('input');
    let content = document.createElement('ul');
    let clear = document.createElement('button');
    search.className = 'lm-CommandPalette-search';
    wrapper.className = 'lm-CommandPalette-wrapper';
    input.className = 'lm-CommandPalette-input';
    clear.className = 'lm-close-icon';

    content.className = 'lm-CommandPalette-content';
    input.spellcheck = false;
    wrapper.appendChild(input);
    wrapper.appendChild(clear);
    search.appendChild(wrapper);
    node.appendChild(search);
    node.appendChild(content);
    return node;
  }

  /**
   * Create a new command item from a command registry and options.
   */
  export function createItem(
    commands: CommandRegistry,
    options: CommandPalette.IItemOptions
  ): CommandPalette.IItem {
    return new CommandItem(commands, options);
  }

  /**
   * A search result object for a header label.
   */
  export interface IHeaderResult {
    /**
     * The discriminated type of the object.
     */
    readonly type: 'header';

    /**
     * The category for the header.
     */
    readonly category: string;

    /**
     * The indices of the matched category characters.
     */
    readonly indices: ReadonlyArray<number> | null;
  }

  /**
   * A search result object for a command item.
   */
  export interface IItemResult {
    /**
     * The discriminated type of the object.
     */
    readonly type: 'item';

    /**
     * The command item which was matched.
     */
    readonly item: CommandPalette.IItem;

    /**
     * The indices of the matched label characters.
     */
    readonly indices: ReadonlyArray<number> | null;
  }

  /**
   * A type alias for a search result item.
   */
  export type SearchResult = IHeaderResult | IItemResult;

  /**
   * Search an array of command items for fuzzy matches.
   */
  export function search(
    items: CommandPalette.IItem[],
    query: string
  ): SearchResult[] {
    // Fuzzy match the items for the query.
    let scores = matchItems(items, query);

    // Sort the items based on their score.
    scores.sort(scoreCmp);

    // Create the results for the search.
    return createResults(scores);
  }

  /**
   * Test whether a result item can be activated.
   */
  export function canActivate(result: SearchResult): boolean {
    return result.type === 'item' && result.item.isEnabled;
  }

  /**
   * Normalize a category for a command item.
   */
  function normalizeCategory(category: string): string {
    return category.trim().replace(/\s+/g, ' ');
  }

  /**
   * Normalize the query text for a fuzzy search.
   */
  function normalizeQuery(text: string): string {
    return text.replace(/\s+/g, '').toLowerCase();
  }

  /**
   * An enum of the supported match types.
   */
  const enum MatchType {
    Label,
    Category,
    Split,
    Default
  }

  /**
   * A text match score with associated command item.
   */
  interface IScore {
    /**
     * The numerical type for the text match.
     */
    matchType: MatchType;

    /**
     * The numerical score for the text match.
     */
    score: number;

    /**
     * The indices of the matched category characters.
     */
    categoryIndices: number[] | null;

    /**
     * The indices of the matched label characters.
     */
    labelIndices: number[] | null;

    /**
     * The command item associated with the match.
     */
    item: CommandPalette.IItem;
  }

  /**
   * Perform a fuzzy match on an array of command items.
   */
  function matchItems(items: CommandPalette.IItem[], query: string): IScore[] {
    // Normalize the query text to lower case with no whitespace.
    query = normalizeQuery(query);

    // Create the array to hold the scores.
    let scores: IScore[] = [];

    // Iterate over the items and match against the query.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Ignore items which are not visible.
      let item = items[i];
      if (!item.isVisible) {
        continue;
      }

      // If the query is empty, all items are matched by default.
      if (!query) {
        scores.push({
          matchType: MatchType.Default,
          categoryIndices: null,
          labelIndices: null,
          score: 0,
          item
        });
        continue;
      }

      // Run the fuzzy search for the item and query.
      let score = fuzzySearch(item, query);

      // Ignore the item if it is not a match.
      if (!score) {
        continue;
      }

      // Penalize disabled items.
      // TODO - push disabled items all the way down in sort cmp?
      if (!item.isEnabled) {
        score.score += 1000;
      }

      // Add the score to the results.
      scores.push(score);
    }

    // Return the final array of scores.
    return scores;
  }

  /**
   * Perform a fuzzy search on a single command item.
   */
  function fuzzySearch(
    item: CommandPalette.IItem,
    query: string
  ): IScore | null {
    // Create the source text to be searched.
    let category = item.category.toLowerCase();
    let label = item.label.toLowerCase();
    let source = `${category} ${label}`;

    // Set up the match score and indices array.
    let score = Infinity;
    let indices: number[] | null = null;

    // The regex for search word boundaries
    let rgx = /\b\w/g;

    // Search the source by word boundary.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Find the next word boundary in the source.
      let rgxMatch = rgx.exec(source);

      // Break if there is no more source context.
      if (!rgxMatch) {
        break;
      }

      // Run the string match on the relevant substring.
      let match = StringExt.matchSumOfDeltas(source, query, rgxMatch.index);

      // Break if there is no match.
      if (!match) {
        break;
      }

      // Update the match if the score is better.
      if (match && match.score <= score) {
        score = match.score;
        indices = match.indices;
      }
    }

    // Bail if there was no match.
    if (!indices || score === Infinity) {
      return null;
    }

    // Compute the pivot index between category and label text.
    let pivot = category.length + 1;

    // Find the slice index to separate matched indices.
    let j = ArrayExt.lowerBound(indices, pivot, (a, b) => a - b);

    // Extract the matched category and label indices.
    let categoryIndices = indices.slice(0, j);
    let labelIndices = indices.slice(j);

    // Adjust the label indices for the pivot offset.
    for (let i = 0, n = labelIndices.length; i < n; ++i) {
      labelIndices[i] -= pivot;
    }

    // Handle a pure label match.
    if (categoryIndices.length === 0) {
      return {
        matchType: MatchType.Label,
        categoryIndices: null,
        labelIndices,
        score,
        item
      };
    }

    // Handle a pure category match.
    if (labelIndices.length === 0) {
      return {
        matchType: MatchType.Category,
        categoryIndices,
        labelIndices: null,
        score,
        item
      };
    }

    // Handle a split match.
    return {
      matchType: MatchType.Split,
      categoryIndices,
      labelIndices,
      score,
      item
    };
  }

  /**
   * A sort comparison function for a match score.
   */
  function scoreCmp(a: IScore, b: IScore): number {
    // First compare based on the match type
    let m1 = a.matchType - b.matchType;
    if (m1 !== 0) {
      return m1;
    }

    // Otherwise, compare based on the match score.
    let d1 = a.score - b.score;
    if (d1 !== 0) {
      return d1;
    }

    // Find the match index based on the match type.
    let i1 = 0;
    let i2 = 0;
    switch (a.matchType) {
      case MatchType.Label:
        i1 = a.labelIndices![0];
        i2 = b.labelIndices![0];
        break;
      case MatchType.Category:
      case MatchType.Split:
        i1 = a.categoryIndices![0];
        i2 = b.categoryIndices![0];
        break;
    }

    // Compare based on the match index.
    if (i1 !== i2) {
      return i1 - i2;
    }

    // Otherwise, compare by category.
    let d2 = a.item.category.localeCompare(b.item.category);
    if (d2 !== 0) {
      return d2;
    }

    // Otherwise, compare by rank.
    let r1 = a.item.rank;
    let r2 = b.item.rank;
    if (r1 !== r2) {
      return r1 < r2 ? -1 : 1; // Infinity safe
    }

    // Finally, compare by label.
    return a.item.label.localeCompare(b.item.label);
  }

  /**
   * Create the results from an array of sorted scores.
   */
  function createResults(scores: IScore[]): SearchResult[] {
    // Set up an array to track which scores have been visited.
    let visited = new Array(scores.length);
    ArrayExt.fill(visited, false);

    // Set up the search results array.
    let results: SearchResult[] = [];

    // Iterate over each score in the array.
    for (let i = 0, n = scores.length; i < n; ++i) {
      // Ignore a score which has already been processed.
      if (visited[i]) {
        continue;
      }

      // Extract the current item and indices.
      let { item, categoryIndices } = scores[i];

      // Extract the category for the current item.
      let category = item.category;

      // Add the header result for the category.
      results.push({ type: 'header', category, indices: categoryIndices });

      // Find the rest of the scores with the same category.
      for (let j = i; j < n; ++j) {
        // Ignore a score which has already been processed.
        if (visited[j]) {
          continue;
        }

        // Extract the data for the current score.
        let { item, labelIndices } = scores[j];

        // Ignore an item with a different category.
        if (item.category !== category) {
          continue;
        }

        // Create the item result for the score.
        results.push({ type: 'item', item, indices: labelIndices });

        // Mark the score as processed.
        visited[j] = true;
      }
    }

    // Return the final results.
    return results;
  }

  /**
   * A concrete implementation of `CommandPalette.IItem`.
   */
  class CommandItem implements CommandPalette.IItem {
    /**
     * Construct a new command item.
     */
    constructor(
      commands: CommandRegistry,
      options: CommandPalette.IItemOptions
    ) {
      this._commands = commands;
      this.category = normalizeCategory(options.category);
      this.command = options.command;
      this.args = options.args || JSONExt.emptyObject;
      this.rank = options.rank !== undefined ? options.rank : Infinity;
    }

    /**
     * The category for the command item.
     */
    readonly category: string;

    /**
     * The command to execute when the item is triggered.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: ReadonlyJSONObject;

    /**
     * The rank for the command item.
     */
    readonly rank: number;

    /**
     * The display label for the command item.
     */
    get label(): string {
      return this._commands.label(this.command, this.args);
    }

    /**
     * The icon renderer for the command item.
     */
    get icon(): VirtualElement.IRenderer | undefined {
      return this._commands.icon(this.command, this.args);
    }

    /**
     * The icon class for the command item.
     */
    get iconClass(): string {
      return this._commands.iconClass(this.command, this.args);
    }

    /**
     * The icon label for the command item.
     */
    get iconLabel(): string {
      return this._commands.iconLabel(this.command, this.args);
    }

    /**
     * The display caption for the command item.
     */
    get caption(): string {
      return this._commands.caption(this.command, this.args);
    }

    /**
     * The extra class name for the command item.
     */
    get className(): string {
      return this._commands.className(this.command, this.args);
    }

    /**
     * The dataset for the command item.
     */
    get dataset(): CommandRegistry.Dataset {
      return this._commands.dataset(this.command, this.args);
    }

    /**
     * Whether the command item is enabled.
     */
    get isEnabled(): boolean {
      return this._commands.isEnabled(this.command, this.args);
    }

    /**
     * Whether the command item is toggled.
     */
    get isToggled(): boolean {
      return this._commands.isToggled(this.command, this.args);
    }

    /**
     * Whether the command item is toggleable.
     */
    get isToggleable(): boolean {
      return this._commands.isToggleable(this.command, this.args);
    }

    /**
     * Whether the command item is visible.
     */
    get isVisible(): boolean {
      return this._commands.isVisible(this.command, this.args);
    }

    /**
     * The key binding for the command item.
     */
    get keyBinding(): CommandRegistry.IKeyBinding | null {
      let { command, args } = this;
      return (
        ArrayExt.findLastValue(this._commands.keyBindings, kb => {
          return kb.command === command && JSONExt.deepEqual(kb.args, args);
        }) || null
      );
    }

    private _commands: CommandRegistry;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { CommandRegistry } from '@lumino/commands';

import { DisposableDelegate, IDisposable } from '@lumino/disposable';

import { Selector } from '@lumino/domutils';

import { Menu } from './menu';

/**
 * An object which implements a universal context menu.
 *
 * #### Notes
 * The items shown in the context menu are determined by CSS selector
 * matching against the DOM hierarchy at the site of the mouse click.
 * This is similar in concept to how keyboard shortcuts are matched
 * in the command registry.
 */
export class ContextMenu {
  /**
   * Construct a new context menu.
   *
   * @param options - The options for initializing the menu.
   */
  constructor(options: ContextMenu.IOptions) {
    const { groupByTarget, sortBySelector, ...others } = options;
    this.menu = new Menu(others);
    this._groupByTarget = groupByTarget !== false;
    this._sortBySelector = sortBySelector !== false;
  }

  /**
   * The menu widget which displays the matched context items.
   */
  readonly menu: Menu;

  /**
   * Add an item to the context menu.
   *
   * @param options - The options for creating the item.
   *
   * @returns A disposable which will remove the item from the menu.
   */
  addItem(options: ContextMenu.IItemOptions): IDisposable {
    // Create an item from the given options.
    let item = Private.createItem(options, this._idTick++);

    // Add the item to the internal array.
    this._items.push(item);

    // Return a disposable which will remove the item.
    return new DisposableDelegate(() => {
      ArrayExt.removeFirstOf(this._items, item);
    });
  }

  /**
   * Open the context menu in response to a `'contextmenu'` event.
   *
   * @param event - The `'contextmenu'` event of interest.
   *
   * @returns `true` if the menu was opened, or `false` if no items
   *   matched the event and the menu was not opened.
   *
   * #### Notes
   * This method will populate the context menu with items which match
   * the propagation path of the event, then open the menu at the mouse
   * position indicated by the event.
   */
  open(event: MouseEvent): boolean {
    // Clear the current contents of the context menu.
    this.menu.clearItems();

    // Bail early if there are no items to match.
    if (this._items.length === 0) {
      return false;
    }

    // Find the matching items for the event.
    let items = Private.matchItems(
      this._items,
      event,
      this._groupByTarget,
      this._sortBySelector
    );

    // Bail if there are no matching items.
    if (!items || items.length === 0) {
      return false;
    }

    // Add the filtered items to the menu.
    for (const item of items) {
      this.menu.addItem(item);
    }

    // Open the context menu at the current mouse position.
    this.menu.open(event.clientX, event.clientY);

    // Indicate success.
    return true;
  }

  private _groupByTarget: boolean = true;
  private _idTick = 0;
  private _items: Private.IItem[] = [];
  private _sortBySelector: boolean = true;
}

/**
 * The namespace for the `ContextMenu` class statics.
 */
export namespace ContextMenu {
  /**
   * An options object for initializing a context menu.
   */
  export interface IOptions {
    /**
     * The command registry to use with the context menu.
     */
    commands: CommandRegistry;

    /**
     * A custom renderer for use with the context menu.
     */
    renderer?: Menu.IRenderer;

    /**
     * Whether to sort by selector and rank or only rank.
     *
     * Default true.
     */
    sortBySelector?: boolean;

    /**
     * Whether to group items following the DOM hierarchy.
     *
     * Default true.
     *
     * #### Note
     * If true, when the mouse event occurs on element `span` within `div.top`,
     * the items matching `div.top` will be shown before the ones matching `body`.
     */
    groupByTarget?: boolean;
  }

  /**
   * An options object for creating a context menu item.
   */
  export interface IItemOptions extends Menu.IItemOptions {
    /**
     * The CSS selector for the context menu item.
     *
     * The context menu item will only be displayed in the context menu
     * when the selector matches a node on the propagation path of the
     * contextmenu event. This allows the menu item to be restricted to
     * user-defined contexts.
     *
     * The selector must not contain commas.
     */
    selector: string;

    /**
     * The rank for the item.
     *
     * The rank is used as a tie-breaker when ordering context menu
     * items for display. Items are sorted in the following order:
     *   1. Depth in the DOM tree (deeper is better)
     *   2. Selector specificity (higher is better)
     *   3. Rank (lower is better)
     *   4. Insertion order
     *
     * The default rank is `Infinity`.
     */
    rank?: number;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A normalized item for a context menu.
   */
  export interface IItem extends Menu.IItemOptions {
    /**
     * The selector for the item.
     */
    selector: string;

    /**
     * The rank for the item.
     */
    rank: number;

    /**
     * The tie-breaking id for the item.
     */
    id: number;
  }

  /**
   * Create a normalized context menu item from an options object.
   */
  export function createItem(
    options: ContextMenu.IItemOptions,
    id: number
  ): IItem {
    let selector = validateSelector(options.selector);
    let rank = options.rank !== undefined ? options.rank : Infinity;
    return { ...options, selector, rank, id };
  }

  /**
   * Find the items which match a context menu event.
   *
   * The results are sorted by DOM level, specificity, and rank.
   */
  export function matchItems(
    items: IItem[],
    event: MouseEvent,
    groupByTarget: boolean,
    sortBySelector: boolean
  ): IItem[] | null {
    // Look up the target of the event.
    let target = event.target as Element | null;

    // Bail if there is no target.
    if (!target) {
      return null;
    }

    // Look up the current target of the event.
    let currentTarget = event.currentTarget as Element | null;

    // Bail if there is no current target.
    if (!currentTarget) {
      return null;
    }

    // There are some third party libraries that cause the `target` to
    // be detached from the DOM before lumino can process the event.
    // If that happens, search for a new target node by point. If that
    // node is still dangling, bail.
    if (!currentTarget.contains(target)) {
      target = document.elementFromPoint(event.clientX, event.clientY);
      if (!target || !currentTarget.contains(target)) {
        return null;
      }
    }

    // Set up the result array.
    let result: IItem[] = [];

    // Copy the items array to allow in-place modification.
    let availableItems: Array<IItem | null> = items.slice();

    // Walk up the DOM hierarchy searching for matches.
    while (target !== null) {
      // Set up the match array for this DOM level.
      let matches: IItem[] = [];

      // Search the remaining items for matches.
      for (let i = 0, n = availableItems.length; i < n; ++i) {
        // Fetch the item.
        let item = availableItems[i];

        // Skip items which are already consumed.
        if (!item) {
          continue;
        }

        // Skip items which do not match the element.
        if (!Selector.matches(target, item.selector)) {
          continue;
        }

        // Add the matched item to the result for this DOM level.
        matches.push(item);

        // Mark the item as consumed.
        availableItems[i] = null;
      }

      // Sort the matches for this level and add them to the results.
      if (matches.length !== 0) {
        if (groupByTarget) {
          matches.sort(sortBySelector ? itemCmp : itemCmpRank);
        }
        result.push(...matches);
      }

      // Stop searching at the limits of the DOM range.
      if (target === currentTarget) {
        break;
      }

      // Step to the parent DOM level.
      target = target.parentElement;
    }

    if (!groupByTarget) {
      result.sort(sortBySelector ? itemCmp : itemCmpRank);
    }

    // Return the matched and sorted results.
    return result;
  }

  /**
   * Validate the selector for a menu item.
   *
   * This returns the validated selector, or throws if the selector is
   * invalid or contains commas.
   */
  function validateSelector(selector: string): string {
    if (selector.indexOf(',') !== -1) {
      throw new Error(`Selector cannot contain commas: ${selector}`);
    }
    if (!Selector.isValid(selector)) {
      throw new Error(`Invalid selector: ${selector}`);
    }
    return selector;
  }

  /**
   * A sort comparison function for a context menu item by ranks.
   */
  function itemCmpRank(a: IItem, b: IItem): number {
    // Sort based on rank.
    let r1 = a.rank;
    let r2 = b.rank;
    if (r1 !== r2) {
      return r1 < r2 ? -1 : 1; // Infinity-safe
    }

    // When all else fails, sort by item id.
    return a.id - b.id;
  }

  /**
   * A sort comparison function for a context menu item by selectors and ranks.
   */
  function itemCmp(a: IItem, b: IItem): number {
    // Sort first based on selector specificity.
    let s1 = Selector.calculateSpecificity(a.selector);
    let s2 = Selector.calculateSpecificity(b.selector);
    if (s1 !== s2) {
      return s2 - s1;
    }

    // If specificities are equal
    return itemCmpRank(a, b);
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { ElementExt } from '@lumino/domutils';

import { Message, MessageLoop } from '@lumino/messaging';

import { BoxEngine, BoxSizer } from './boxengine';

import { Layout, LayoutItem } from './layout';

import { TabBar } from './tabbar';

import Utils from './utils';

import { Widget } from './widget';

/**
 * A layout which provides a flexible docking arrangement.
 *
 * #### Notes
 * The consumer of this layout is responsible for handling all signals
 * from the generated tab bars and managing the visibility of widgets
 * and tab bars as needed.
 */
export class DockLayout extends Layout {
  /**
   * Construct a new dock layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: DockLayout.IOptions) {
    super();
    this.renderer = options.renderer;
    if (options.spacing !== undefined) {
      this._spacing = Utils.clampDimension(options.spacing);
    }
    this._document = options.document || document;
    this._hiddenMode =
      options.hiddenMode !== undefined
        ? options.hiddenMode
        : Widget.HiddenMode.Display;
  }

  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This will clear and dispose all widgets in the layout.
   */
  dispose(): void {
    // Get an iterator over the widgets in the layout.
    let widgets = this[Symbol.iterator]();

    // Dispose of the layout items.
    this._items.forEach(item => {
      item.dispose();
    });

    // Clear the layout state before disposing the widgets.
    this._box = null;
    this._root = null;
    this._items.clear();

    // Dispose of the widgets contained in the old layout root.
    for (const widget of widgets) {
      widget.dispose();
    }

    // Dispose of the base class.
    super.dispose();
  }

  /**
   * The renderer used by the dock layout.
   */
  readonly renderer: DockLayout.IRenderer;

  /**
   * The method for hiding child widgets.
   *
   * #### Notes
   * If there is only one child widget, `Display` hiding mode will be used
   * regardless of this setting.
   */
  get hiddenMode(): Widget.HiddenMode {
    return this._hiddenMode;
  }
  set hiddenMode(v: Widget.HiddenMode) {
    if (this._hiddenMode === v) {
      return;
    }
    this._hiddenMode = v;
    for (const bar of this.tabBars()) {
      if (bar.titles.length > 1) {
        for (const title of bar.titles) {
          title.owner.hiddenMode = this._hiddenMode;
        }
      }
    }
  }

  /**
   * Get the inter-element spacing for the dock layout.
   */
  get spacing(): number {
    return this._spacing;
  }

  /**
   * Set the inter-element spacing for the dock layout.
   */
  set spacing(value: number) {
    value = Utils.clampDimension(value);
    if (this._spacing === value) {
      return;
    }
    this._spacing = value;
    if (!this.parent) {
      return;
    }
    this.parent.fit();
  }

  /**
   * Whether the dock layout is empty.
   */
  get isEmpty(): boolean {
    return this._root === null;
  }

  /**
   * Create an iterator over all widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   *
   * #### Notes
   * This iterator includes the generated tab bars.
   */
  *[Symbol.iterator](): IterableIterator<Widget> {
    if (this._root) {
      yield* this._root.iterAllWidgets();
    }
  }

  /**
   * Create an iterator over the user widgets in the layout.
   *
   * @returns A new iterator over the user widgets in the layout.
   *
   * #### Notes
   * This iterator does not include the generated tab bars.
   */
  *widgets(): IterableIterator<Widget> {
    if (this._root) {
      yield* this._root.iterUserWidgets();
    }
  }

  /**
   * Create an iterator over the selected widgets in the layout.
   *
   * @returns A new iterator over the selected user widgets.
   *
   * #### Notes
   * This iterator yields the widgets corresponding to the current tab
   * of each tab bar in the layout.
   */
  *selectedWidgets(): IterableIterator<Widget> {
    if (this._root) {
      yield* this._root.iterSelectedWidgets();
    }
  }

  /**
   * Create an iterator over the tab bars in the layout.
   *
   * @returns A new iterator over the tab bars in the layout.
   *
   * #### Notes
   * This iterator does not include the user widgets.
   */
  *tabBars(): IterableIterator<TabBar<Widget>> {
    if (this._root) {
      yield* this._root.iterTabBars();
    }
  }

  /**
   * Create an iterator over the handles in the layout.
   *
   * @returns A new iterator over the handles in the layout.
   */
  *handles(): IterableIterator<HTMLDivElement> {
    if (this._root) {
      yield* this._root.iterHandles();
    }
  }

  /**
   * Move a handle to the given offset position.
   *
   * @param handle - The handle to move.
   *
   * @param offsetX - The desired offset X position of the handle.
   *
   * @param offsetY - The desired offset Y position of the handle.
   *
   * #### Notes
   * If the given handle is not contained in the layout, this is no-op.
   *
   * The handle will be moved as close as possible to the desired
   * position without violating any of the layout constraints.
   *
   * Only one of the coordinates is used depending on the orientation
   * of the handle. This method accepts both coordinates to make it
   * easy to invoke from a mouse move event without needing to know
   * the handle orientation.
   */
  moveHandle(handle: HTMLDivElement, offsetX: number, offsetY: number): void {
    // Bail early if there is no root or if the handle is hidden.
    let hidden = handle.classList.contains('lm-mod-hidden');
    if (!this._root || hidden) {
      return;
    }

    // Lookup the split node for the handle.
    let data = this._root.findSplitNode(handle);
    if (!data) {
      return;
    }

    // Compute the desired delta movement for the handle.
    let delta: number;
    if (data.node.orientation === 'horizontal') {
      delta = offsetX - handle.offsetLeft;
    } else {
      delta = offsetY - handle.offsetTop;
    }

    // Bail if there is no handle movement.
    if (delta === 0) {
      return;
    }

    // Prevent sibling resizing unless needed.
    data.node.holdSizes();

    // Adjust the sizers to reflect the handle movement.
    BoxEngine.adjust(data.node.sizers, data.index, delta);

    // Update the layout of the widgets.
    if (this.parent) {
      this.parent.update();
    }
  }

  /**
   * Save the current configuration of the dock layout.
   *
   * @returns A new config object for the current layout state.
   *
   * #### Notes
   * The return value can be provided to the `restoreLayout` method
   * in order to restore the layout to its current configuration.
   */
  saveLayout(): DockLayout.ILayoutConfig {
    // Bail early if there is no root.
    if (!this._root) {
      return { main: null };
    }

    // Hold the current sizes in the layout tree.
    this._root.holdAllSizes();

    // Return the layout config.
    return { main: this._root.createConfig() };
  }

  /**
   * Restore the layout to a previously saved configuration.
   *
   * @param config - The layout configuration to restore.
   *
   * #### Notes
   * Widgets which currently belong to the layout but which are not
   * contained in the config will be unparented.
   */
  restoreLayout(config: DockLayout.ILayoutConfig): void {
    // Create the widget set for validating the config.
    let widgetSet = new Set<Widget>();

    // Normalize the main area config and collect the widgets.
    let mainConfig: DockLayout.AreaConfig | null;
    if (config.main) {
      mainConfig = Private.normalizeAreaConfig(config.main, widgetSet);
    } else {
      mainConfig = null;
    }

    // Create iterators over the old content.
    let oldWidgets = this.widgets();
    let oldTabBars = this.tabBars();
    let oldHandles = this.handles();

    // Clear the root before removing the old content.
    this._root = null;

    // Unparent the old widgets which are not in the new config.
    for (const widget of oldWidgets) {
      if (!widgetSet.has(widget)) {
        widget.parent = null;
      }
    }

    // Dispose of the old tab bars.
    for (const tabBar of oldTabBars) {
      tabBar.dispose();
    }

    // Remove the old handles.
    for (const handle of oldHandles) {
      if (handle.parentNode) {
        handle.parentNode.removeChild(handle);
      }
    }

    // Reparent the new widgets to the current parent.
    for (const widget of widgetSet) {
      widget.parent = this.parent;
    }

    // Create the root node for the new config.
    if (mainConfig) {
      this._root = Private.realizeAreaConfig(
        mainConfig,
        {
          // Ignoring optional `document` argument as we must reuse `this._document`
          createTabBar: (document?: Document | ShadowRoot) =>
            this._createTabBar(),
          createHandle: () => this._createHandle()
        },
        this._document
      );
    } else {
      this._root = null;
    }

    // If there is no parent, there is nothing more to do.
    if (!this.parent) {
      return;
    }

    // Attach the new widgets to the parent.
    widgetSet.forEach(widget => {
      this.attachWidget(widget);
    });

    // Post a fit request to the parent.
    this.parent.fit();
  }

  /**
   * Add a widget to the dock layout.
   *
   * @param widget - The widget to add to the dock layout.
   *
   * @param options - The additional options for adding the widget.
   *
   * #### Notes
   * The widget will be moved if it is already contained in the layout.
   *
   * An error will be thrown if the reference widget is invalid.
   */
  addWidget(widget: Widget, options: DockLayout.IAddOptions = {}): void {
    // Parse the options.
    let ref = options.ref || null;
    let mode = options.mode || 'tab-after';

    // Find the tab node which holds the reference widget.
    let refNode: Private.TabLayoutNode | null = null;
    if (this._root && ref) {
      refNode = this._root.findTabNode(ref);
    }

    // Throw an error if the reference widget is invalid.
    if (ref && !refNode) {
      throw new Error('Reference widget is not in the layout.');
    }

    // Reparent the widget to the current layout parent.
    widget.parent = this.parent;

    // Insert the widget according to the insert mode.
    switch (mode) {
      case 'tab-after':
        this._insertTab(widget, ref, refNode, true);
        break;
      case 'tab-before':
        this._insertTab(widget, ref, refNode, false);
        break;
      case 'split-top':
        this._insertSplit(widget, ref, refNode, 'vertical', false);
        break;
      case 'split-left':
        this._insertSplit(widget, ref, refNode, 'horizontal', false);
        break;
      case 'split-right':
        this._insertSplit(widget, ref, refNode, 'horizontal', true);
        break;
      case 'split-bottom':
        this._insertSplit(widget, ref, refNode, 'vertical', true);
        break;
    }

    // Do nothing else if there is no parent widget.
    if (!this.parent) {
      return;
    }

    // Ensure the widget is attached to the parent widget.
    this.attachWidget(widget);

    // Post a fit request for the parent widget.
    this.parent.fit();
  }

  /**
   * Remove a widget from the layout.
   *
   * @param widget - The widget to remove from the layout.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method does *not* modify the widget's `parent`.
   */
  removeWidget(widget: Widget): void {
    // Remove the widget from its current layout location.
    this._removeWidget(widget);

    // Do nothing else if there is no parent widget.
    if (!this.parent) {
      return;
    }

    // Detach the widget from the parent widget.
    this.detachWidget(widget);

    // Post a fit request for the parent widget.
    this.parent.fit();
  }

  /**
   * Find the tab area which contains the given client position.
   *
   * @param clientX - The client X position of interest.
   *
   * @param clientY - The client Y position of interest.
   *
   * @returns The geometry of the tab area at the given position, or
   *   `null` if there is no tab area at the given position.
   */
  hitTestTabAreas(
    clientX: number,
    clientY: number
  ): DockLayout.ITabAreaGeometry | null {
    // Bail early if hit testing cannot produce valid results.
    if (!this._root || !this.parent || !this.parent.isVisible) {
      return null;
    }

    // Ensure the parent box sizing data is computed.
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent.node);
    }

    // Convert from client to local coordinates.
    let rect = this.parent.node.getBoundingClientRect();
    let x = clientX - rect.left - this._box.borderLeft;
    let y = clientY - rect.top - this._box.borderTop;

    // Find the tab layout node at the local position.
    let tabNode = this._root.hitTestTabNodes(x, y);

    // Bail if a tab layout node was not found.
    if (!tabNode) {
      return null;
    }

    // Extract the data from the tab node.
    let { tabBar, top, left, width, height } = tabNode;

    // Compute the right and bottom edges of the tab area.
    let borderWidth = this._box.borderLeft + this._box.borderRight;
    let borderHeight = this._box.borderTop + this._box.borderBottom;
    let right = rect.width - borderWidth - (left + width);
    let bottom = rect.height - borderHeight - (top + height);

    // Return the hit test results.
    return { tabBar, x, y, top, left, right, bottom, width, height };
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    // Perform superclass initialization.
    super.init();

    // Attach each widget to the parent.
    for (const widget of this) {
      this.attachWidget(widget);
    }

    // Attach each handle to the parent.
    for (const handle of this.handles()) {
      this.parent!.node.appendChild(handle);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * Attach the widget to the layout parent widget.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This is a no-op if the widget is already attached.
   */
  protected attachWidget(widget: Widget): void {
    // Do nothing if the widget is already attached.
    if (this.parent!.node === widget.node.parentNode) {
      return;
    }

    // Create the layout item for the widget.
    this._items.set(widget, new LayoutItem(widget));

    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget's node to the parent.
    this.parent!.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }
  }

  /**
   * Detach the widget from the layout parent widget.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This is a no-op if the widget is not attached.
   */
  protected detachWidget(widget: Widget): void {
    // Do nothing if the widget is not attached.
    if (this.parent!.node !== widget.node.parentNode) {
      return;
    }

    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }

    // Delete the layout item for the widget.
    let item = this._items.get(widget);
    if (item) {
      this._items.delete(widget);
      item.dispose();
    }
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg);
    this.parent!.update();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height);
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1);
    }
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit();
    }
  }

  /**
   * Remove the specified widget from the layout structure.
   *
   * #### Notes
   * This is a no-op if the widget is not in the layout tree.
   *
   * This does not detach the widget from the parent node.
   */
  private _removeWidget(widget: Widget): void {
    // Bail early if there is no layout root.
    if (!this._root) {
      return;
    }

    // Find the tab node which contains the given widget.
    let tabNode = this._root.findTabNode(widget);

    // Bail early if the tab node is not found.
    if (!tabNode) {
      return;
    }

    Private.removeAria(widget);

    // If there are multiple tabs, just remove the widget's tab.
    if (tabNode.tabBar.titles.length > 1) {
      tabNode.tabBar.removeTab(widget.title);
      if (
        this._hiddenMode === Widget.HiddenMode.Scale &&
        tabNode.tabBar.titles.length == 1
      ) {
        const existingWidget = tabNode.tabBar.titles[0].owner;
        existingWidget.hiddenMode = Widget.HiddenMode.Display;
      }
      return;
    }

    // Otherwise, the tab node needs to be removed...

    // Dispose the tab bar.
    tabNode.tabBar.dispose();

    // Handle the case where the tab node is the root.
    if (this._root === tabNode) {
      this._root = null;
      return;
    }

    // Otherwise, remove the tab node from its parent...

    // Prevent widget resizing unless needed.
    this._root.holdAllSizes();

    // Clear the parent reference on the tab node.
    let splitNode = tabNode.parent!;
    tabNode.parent = null;

    // Remove the tab node from its parent split node.
    let i = ArrayExt.removeFirstOf(splitNode.children, tabNode);
    let handle = ArrayExt.removeAt(splitNode.handles, i)!;
    ArrayExt.removeAt(splitNode.sizers, i);

    // Remove the handle from its parent DOM node.
    if (handle.parentNode) {
      handle.parentNode.removeChild(handle);
    }

    // If there are multiple children, just update the handles.
    if (splitNode.children.length > 1) {
      splitNode.syncHandles();
      return;
    }

    // Otherwise, the split node also needs to be removed...

    // Clear the parent reference on the split node.
    let maybeParent = splitNode.parent;
    splitNode.parent = null;

    // Lookup the remaining child node and handle.
    let childNode = splitNode.children[0];
    let childHandle = splitNode.handles[0];

    // Clear the split node data.
    splitNode.children.length = 0;
    splitNode.handles.length = 0;
    splitNode.sizers.length = 0;

    // Remove the child handle from its parent node.
    if (childHandle.parentNode) {
      childHandle.parentNode.removeChild(childHandle);
    }

    // Handle the case where the split node is the root.
    if (this._root === splitNode) {
      childNode.parent = null;
      this._root = childNode;
      return;
    }

    // Otherwise, move the child node to the parent node...
    let parentNode = maybeParent!;

    // Lookup the index of the split node.
    let j = parentNode.children.indexOf(splitNode);

    // Handle the case where the child node is a tab node.
    if (childNode instanceof Private.TabLayoutNode) {
      childNode.parent = parentNode;
      parentNode.children[j] = childNode;
      return;
    }

    // Remove the split data from the parent.
    let splitHandle = ArrayExt.removeAt(parentNode.handles, j)!;
    ArrayExt.removeAt(parentNode.children, j);
    ArrayExt.removeAt(parentNode.sizers, j);

    // Remove the handle from its parent node.
    if (splitHandle.parentNode) {
      splitHandle.parentNode.removeChild(splitHandle);
    }

    // The child node and the split parent node will have the same
    // orientation. Merge the grand-children with the parent node.
    for (let i = 0, n = childNode.children.length; i < n; ++i) {
      let gChild = childNode.children[i];
      let gHandle = childNode.handles[i];
      let gSizer = childNode.sizers[i];
      ArrayExt.insert(parentNode.children, j + i, gChild);
      ArrayExt.insert(parentNode.handles, j + i, gHandle);
      ArrayExt.insert(parentNode.sizers, j + i, gSizer);
      gChild.parent = parentNode;
    }

    // Clear the child node.
    childNode.children.length = 0;
    childNode.handles.length = 0;
    childNode.sizers.length = 0;
    childNode.parent = null;

    // Sync the handles on the parent node.
    parentNode.syncHandles();
  }

  /**
   * Insert a widget next to an existing tab.
   *
   * #### Notes
   * This does not attach the widget to the parent widget.
   */
  private _insertTab(
    widget: Widget,
    ref: Widget | null,
    refNode: Private.TabLayoutNode | null,
    after: boolean
  ): void {
    // Do nothing if the tab is inserted next to itself.
    if (widget === ref) {
      return;
    }

    // Create the root if it does not exist.
    if (!this._root) {
      let tabNode = new Private.TabLayoutNode(this._createTabBar());
      tabNode.tabBar.addTab(widget.title);
      this._root = tabNode;
      Private.addAria(widget, tabNode.tabBar);
      return;
    }

    // Use the first tab node as the ref node if needed.
    if (!refNode) {
      refNode = this._root.findFirstTabNode()!;
    }

    // If the widget is not contained in the ref node, ensure it is
    // removed from the layout and hidden before being added again.
    if (refNode.tabBar.titles.indexOf(widget.title) === -1) {
      this._removeWidget(widget);
      widget.hide();
    }

    // Lookup the target index for inserting the tab.
    let index: number;
    if (ref) {
      index = refNode.tabBar.titles.indexOf(ref.title);
    } else {
      index = refNode.tabBar.currentIndex;
    }

    // Using transform create an additional layer in the pixel pipeline
    // to limit the number of layer, it is set only if there is more than one widget.
    if (
      this._hiddenMode === Widget.HiddenMode.Scale &&
      refNode.tabBar.titles.length > 0
    ) {
      if (refNode.tabBar.titles.length == 1) {
        const existingWidget = refNode.tabBar.titles[0].owner;
        existingWidget.hiddenMode = Widget.HiddenMode.Scale;
      }

      widget.hiddenMode = Widget.HiddenMode.Scale;
    } else {
      widget.hiddenMode = Widget.HiddenMode.Display;
    }

    // Insert the widget's tab relative to the target index.
    refNode.tabBar.insertTab(index + (after ? 1 : 0), widget.title);
    Private.addAria(widget, refNode.tabBar);
  }

  /**
   * Insert a widget as a new split area.
   *
   * #### Notes
   * This does not attach the widget to the parent widget.
   */
  private _insertSplit(
    widget: Widget,
    ref: Widget | null,
    refNode: Private.TabLayoutNode | null,
    orientation: Private.Orientation,
    after: boolean
  ): void {
    // Do nothing if there is no effective split.
    if (widget === ref && refNode && refNode.tabBar.titles.length === 1) {
      return;
    }

    // Ensure the widget is removed from the current layout.
    this._removeWidget(widget);

    // Create the tab layout node to hold the widget.
    let tabNode = new Private.TabLayoutNode(this._createTabBar());
    tabNode.tabBar.addTab(widget.title);
    Private.addAria(widget, tabNode.tabBar);

    // Set the root if it does not exist.
    if (!this._root) {
      this._root = tabNode;
      return;
    }

    // If the ref node parent is null, split the root.
    if (!refNode || !refNode.parent) {
      // Ensure the root is split with the correct orientation.
      let root = this._splitRoot(orientation);

      // Determine the insert index for the new tab node.
      let i = after ? root.children.length : 0;

      // Normalize the split node.
      root.normalizeSizes();

      // Create the sizer for new tab node.
      let sizer = Private.createSizer(refNode ? 1 : Private.GOLDEN_RATIO);

      // Insert the tab node sized to the golden ratio.
      ArrayExt.insert(root.children, i, tabNode);
      ArrayExt.insert(root.sizers, i, sizer);
      ArrayExt.insert(root.handles, i, this._createHandle());
      tabNode.parent = root;

      // Re-normalize the split node to maintain the ratios.
      root.normalizeSizes();

      // Finally, synchronize the visibility of the handles.
      root.syncHandles();
      return;
    }

    // Lookup the split node for the ref widget.
    let splitNode = refNode.parent;

    // If the split node already had the correct orientation,
    // the widget can be inserted into the split node directly.
    if (splitNode.orientation === orientation) {
      // Find the index of the ref node.
      let i = splitNode.children.indexOf(refNode);

      // Normalize the split node.
      splitNode.normalizeSizes();

      // Consume half the space for the insert location.
      let s = (splitNode.sizers[i].sizeHint /= 2);

      // Insert the tab node sized to the other half.
      let j = i + (after ? 1 : 0);
      ArrayExt.insert(splitNode.children, j, tabNode);
      ArrayExt.insert(splitNode.sizers, j, Private.createSizer(s));
      ArrayExt.insert(splitNode.handles, j, this._createHandle());
      tabNode.parent = splitNode;

      // Finally, synchronize the visibility of the handles.
      splitNode.syncHandles();
      return;
    }

    // Remove the ref node from the split node.
    let i = ArrayExt.removeFirstOf(splitNode.children, refNode);

    // Create a new normalized split node for the children.
    let childNode = new Private.SplitLayoutNode(orientation);
    childNode.normalized = true;

    // Add the ref node sized to half the space.
    childNode.children.push(refNode);
    childNode.sizers.push(Private.createSizer(0.5));
    childNode.handles.push(this._createHandle());
    refNode.parent = childNode;

    // Add the tab node sized to the other half.
    let j = after ? 1 : 0;
    ArrayExt.insert(childNode.children, j, tabNode);
    ArrayExt.insert(childNode.sizers, j, Private.createSizer(0.5));
    ArrayExt.insert(childNode.handles, j, this._createHandle());
    tabNode.parent = childNode;

    // Synchronize the visibility of the handles.
    childNode.syncHandles();

    // Finally, add the new child node to the original split node.
    ArrayExt.insert(splitNode.children, i, childNode);
    childNode.parent = splitNode;
  }

  /**
   * Ensure the root is a split node with the given orientation.
   */
  private _splitRoot(
    orientation: Private.Orientation
  ): Private.SplitLayoutNode {
    // Bail early if the root already meets the requirements.
    let oldRoot = this._root;
    if (oldRoot instanceof Private.SplitLayoutNode) {
      if (oldRoot.orientation === orientation) {
        return oldRoot;
      }
    }

    // Create a new root node with the specified orientation.
    let newRoot = (this._root = new Private.SplitLayoutNode(orientation));

    // Add the old root to the new root.
    if (oldRoot) {
      newRoot.children.push(oldRoot);
      newRoot.sizers.push(Private.createSizer(0));
      newRoot.handles.push(this._createHandle());
      oldRoot.parent = newRoot;
    }

    // Return the new root as a convenience.
    return newRoot;
  }

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Set up the computed minimum size.
    let minW = 0;
    let minH = 0;

    // Update the size limits for the layout tree.
    if (this._root) {
      let limits = this._root.fit(this._spacing, this._items);
      minW = limits.minWidth;
      minH = limits.minHeight;
    }

    // Update the box sizing and add it to the computed min size.
    let box = (this._box = ElementExt.boxSizing(this.parent!.node));
    minW += box.horizontalSum;
    minH += box.verticalSum;

    // Update the parent's min size constraints.
    let style = this.parent!.node.style;
    style.minWidth = `${minW}px`;
    style.minHeight = `${minH}px`;

    // Set the dirty flag to ensure only a single update occurs.
    this._dirty = true;

    // Notify the ancestor that it should fit immediately. This may
    // cause a resize of the parent, fulfilling the required update.
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest);
    }

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
    }
  }

  /**
   * Update the layout position and size of the widgets.
   *
   * The parent offset dimensions should be `-1` if unknown.
   */
  private _update(offsetWidth: number, offsetHeight: number): void {
    // Clear the dirty flag to indicate the update occurred.
    this._dirty = false;

    // Bail early if there is no root layout node.
    if (!this._root) {
      return;
    }

    // Measure the parent if the offset dimensions are unknown.
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth;
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight;
    }

    // Ensure the parent box sizing data is computed.
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node);
    }

    // Compute the actual layout bounds adjusted for border and padding.
    let x = this._box.paddingTop;
    let y = this._box.paddingLeft;
    let width = offsetWidth - this._box.horizontalSum;
    let height = offsetHeight - this._box.verticalSum;

    // Update the geometry of the layout tree.
    this._root.update(x, y, width, height, this._spacing, this._items);
  }

  /**
   * Create a new tab bar for use by the dock layout.
   *
   * #### Notes
   * The tab bar will be attached to the parent if it exists.
   */
  private _createTabBar(): TabBar<Widget> {
    // Create the tab bar using the renderer.
    let tabBar = this.renderer.createTabBar(this._document);

    // Enforce necessary tab bar behavior.
    tabBar.orientation = 'horizontal';

    // Reparent and attach the tab bar to the parent if possible.
    if (this.parent) {
      tabBar.parent = this.parent;
      this.attachWidget(tabBar);
    }

    // Return the initialized tab bar.
    return tabBar;
  }

  /**
   * Create a new handle for the dock layout.
   *
   * #### Notes
   * The handle will be attached to the parent if it exists.
   */
  private _createHandle(): HTMLDivElement {
    // Create the handle using the renderer.
    let handle = this.renderer.createHandle();

    // Initialize the handle layout behavior.
    let style = handle.style;
    style.position = 'absolute';
    style.top = '0';
    style.left = '0';
    style.width = '0';
    style.height = '0';

    // Attach the handle to the parent if it exists.
    if (this.parent) {
      this.parent.node.appendChild(handle);
    }

    // Return the initialized handle.
    return handle;
  }

  private _spacing = 4;
  private _dirty = false;
  private _root: Private.LayoutNode | null = null;
  private _box: ElementExt.IBoxSizing | null = null;
  private _document: Document | ShadowRoot;
  private _hiddenMode: Widget.HiddenMode;
  private _items: Private.ItemMap = new Map<Widget, LayoutItem>();
}

/**
 * The namespace for the `DockLayout` class statics.
 */
export namespace DockLayout {
  /**
   * An options object for creating a dock layout.
   */
  export interface IOptions {
    /**
     * The document to use with the dock panel.
     *
     * The default is the global `document` instance.
     */
    document?: Document | ShadowRoot;

    /**
     * The method for hiding widgets.
     *
     * The default is `Widget.HiddenMode.Display`.
     */
    hiddenMode?: Widget.HiddenMode;

    /**
     * The renderer to use for the dock layout.
     */
    renderer: IRenderer;

    /**
     * The spacing between items in the layout.
     *
     * The default is `4`.
     */
    spacing?: number;
  }

  /**
   * A renderer for use with a dock layout.
   */
  export interface IRenderer {
    /**
     * Create a new tab bar for use with a dock layout.
     *
     * @returns A new tab bar for a dock layout.
     */
    createTabBar(document?: Document | ShadowRoot): TabBar<Widget>;

    /**
     * Create a new handle node for use with a dock layout.
     *
     * @returns A new handle node for a dock layout.
     */
    createHandle(): HTMLDivElement;
  }

  /**
   * A type alias for the supported insertion modes.
   *
   * An insert mode is used to specify how a widget should be added
   * to the dock layout relative to a reference widget.
   */
  export type InsertMode =
    | /**
     * The area to the top of the reference widget.
     *
     * The widget will be inserted just above the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted at the top edge of the dock layout.
     */
    'split-top'

    /**
     * The area to the left of the reference widget.
     *
     * The widget will be inserted just left of the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted at the left edge of the dock layout.
     */
    | 'split-left'

    /**
     * The area to the right of the reference widget.
     *
     * The widget will be inserted just right of the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted  at the right edge of the dock layout.
     */
    | 'split-right'

    /**
     * The area to the bottom of the reference widget.
     *
     * The widget will be inserted just below the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted at the bottom edge of the dock layout.
     */
    | 'split-bottom'

    /**
     * The tab position before the reference widget.
     *
     * The widget will be added as a tab before the reference widget.
     *
     * If the reference widget is null or invalid, a sensible default
     * will be used.
     */
    | 'tab-before'

    /**
     * The tab position after the reference widget.
     *
     * The widget will be added as a tab after the reference widget.
     *
     * If the reference widget is null or invalid, a sensible default
     * will be used.
     */
    | 'tab-after';

  /**
   * An options object for adding a widget to the dock layout.
   */
  export interface IAddOptions {
    /**
     * The insertion mode for adding the widget.
     *
     * The default is `'tab-after'`.
     */
    mode?: InsertMode;

    /**
     * The reference widget for the insert location.
     *
     * The default is `null`.
     */
    ref?: Widget | null;
  }

  /**
   * A layout config object for a tab area.
   */
  export interface ITabAreaConfig {
    /**
     * The discriminated type of the config object.
     */
    type: 'tab-area';

    /**
     * The widgets contained in the tab area.
     */
    widgets: Widget[];

    /**
     * The index of the selected tab.
     */
    currentIndex: number;
  }

  /**
   * A layout config object for a split area.
   */
  export interface ISplitAreaConfig {
    /**
     * The discriminated type of the config object.
     */
    type: 'split-area';

    /**
     * The orientation of the split area.
     */
    orientation: 'horizontal' | 'vertical';

    /**
     * The children in the split area.
     */
    children: AreaConfig[];

    /**
     * The relative sizes of the children.
     */
    sizes: number[];
  }

  /**
   * A type alias for a general area config.
   */
  export type AreaConfig = ITabAreaConfig | ISplitAreaConfig;

  /**
   * A dock layout configuration object.
   */
  export interface ILayoutConfig {
    /**
     * The layout config for the main dock area.
     */
    main: AreaConfig | null;
  }

  /**
   * An object which represents the geometry of a tab area.
   */
  export interface ITabAreaGeometry {
    /**
     * The tab bar for the tab area.
     */
    tabBar: TabBar<Widget>;

    /**
     * The local X position of the hit test in the dock area.
     *
     * #### Notes
     * This is the distance from the left edge of the layout parent
     * widget, to the local X coordinate of the hit test query.
     */
    x: number;

    /**
     * The local Y position of the hit test in the dock area.
     *
     * #### Notes
     * This is the distance from the top edge of the layout parent
     * widget, to the local Y coordinate of the hit test query.
     */
    y: number;

    /**
     * The local coordinate of the top edge of the tab area.
     *
     * #### Notes
     * This is the distance from the top edge of the layout parent
     * widget, to the top edge of the tab area.
     */
    top: number;

    /**
     * The local coordinate of the left edge of the tab area.
     *
     * #### Notes
     * This is the distance from the left edge of the layout parent
     * widget, to the left edge of the tab area.
     */
    left: number;

    /**
     * The local coordinate of the right edge of the tab area.
     *
     * #### Notes
     * This is the distance from the right edge of the layout parent
     * widget, to the right edge of the tab area.
     */
    right: number;

    /**
     * The local coordinate of the bottom edge of the tab area.
     *
     * #### Notes
     * This is the distance from the bottom edge of the layout parent
     * widget, to the bottom edge of the tab area.
     */
    bottom: number;

    /**
     * The width of the tab area.
     *
     * #### Notes
     * This is total width allocated for the tab area.
     */
    width: number;

    /**
     * The height of the tab area.
     *
     * #### Notes
     * This is total height allocated for the tab area.
     */
    height: number;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A fraction used for sizing root panels; ~= `1 / golden_ratio`.
   */
  export const GOLDEN_RATIO = 0.618;

  /**
   * A type alias for a dock layout node.
   */
  export type LayoutNode = TabLayoutNode | SplitLayoutNode;

  /**
   * A type alias for the orientation of a split layout node.
   */
  export type Orientation = 'horizontal' | 'vertical';

  /**
   * A type alias for a layout item map.
   */
  export type ItemMap = Map<Widget, LayoutItem>;

  /**
   * Create a box sizer with an initial size hint.
   */
  export function createSizer(hint: number): BoxSizer {
    let sizer = new BoxSizer();
    sizer.sizeHint = hint;
    sizer.size = hint;
    return sizer;
  }

  /**
   * Normalize an area config object and collect the visited widgets.
   */
  export function normalizeAreaConfig(
    config: DockLayout.AreaConfig,
    widgetSet: Set<Widget>
  ): DockLayout.AreaConfig | null {
    let result: DockLayout.AreaConfig | null;
    if (config.type === 'tab-area') {
      result = normalizeTabAreaConfig(config, widgetSet);
    } else {
      result = normalizeSplitAreaConfig(config, widgetSet);
    }
    return result;
  }

  /**
   * Convert a normalized area config into a layout tree.
   */
  export function realizeAreaConfig(
    config: DockLayout.AreaConfig,
    renderer: DockLayout.IRenderer,
    document: Document | ShadowRoot
  ): LayoutNode {
    let node: LayoutNode;
    if (config.type === 'tab-area') {
      node = realizeTabAreaConfig(config, renderer, document);
    } else {
      node = realizeSplitAreaConfig(config, renderer, document);
    }
    return node;
  }

  /**
   * A layout node which holds the data for a tabbed area.
   */
  export class TabLayoutNode {
    /**
     * Construct a new tab layout node.
     *
     * @param tabBar - The tab bar to use for the layout node.
     */
    constructor(tabBar: TabBar<Widget>) {
      let tabSizer = new BoxSizer();
      let widgetSizer = new BoxSizer();
      tabSizer.stretch = 0;
      widgetSizer.stretch = 1;
      this.tabBar = tabBar;
      this.sizers = [tabSizer, widgetSizer];
    }

    /**
     * The parent of the layout node.
     */
    parent: SplitLayoutNode | null = null;

    /**
     * The tab bar for the layout node.
     */
    readonly tabBar: TabBar<Widget>;

    /**
     * The sizers for the layout node.
     */
    readonly sizers: [BoxSizer, BoxSizer];

    /**
     * The most recent value for the `top` edge of the layout box.
     */
    get top(): number {
      return this._top;
    }

    /**
     * The most recent value for the `left` edge of the layout box.
     */
    get left(): number {
      return this._left;
    }

    /**
     * The most recent value for the `width` of the layout box.
     */
    get width(): number {
      return this._width;
    }

    /**
     * The most recent value for the `height` of the layout box.
     */
    get height(): number {
      return this._height;
    }

    /**
     * Create an iterator for all widgets in the layout tree.
     */
    *iterAllWidgets(): IterableIterator<Widget> {
      yield this.tabBar;
      yield* this.iterUserWidgets();
    }

    /**
     * Create an iterator for the user widgets in the layout tree.
     */
    *iterUserWidgets(): IterableIterator<Widget> {
      for (const title of this.tabBar.titles) {
        yield title.owner;
      }
    }

    /**
     * Create an iterator for the selected widgets in the layout tree.
     */
    *iterSelectedWidgets(): IterableIterator<Widget> {
      let title = this.tabBar.currentTitle;
      if (title) {
        yield title.owner;
      }
    }

    /**
     * Create an iterator for the tab bars in the layout tree.
     */
    *iterTabBars(): IterableIterator<TabBar<Widget>> {
      yield this.tabBar;
    }

    /**
     * Create an iterator for the handles in the layout tree.
     */
    // eslint-disable-next-line require-yield
    *iterHandles(): IterableIterator<HTMLDivElement> {
      return;
    }

    /**
     * Find the tab layout node which contains the given widget.
     */
    findTabNode(widget: Widget): TabLayoutNode | null {
      return this.tabBar.titles.indexOf(widget.title) !== -1 ? this : null;
    }

    /**
     * Find the split layout node which contains the given handle.
     */
    findSplitNode(
      handle: HTMLDivElement
    ): { index: number; node: SplitLayoutNode } | null {
      return null;
    }

    /**
     * Find the first tab layout node in a layout tree.
     */
    findFirstTabNode(): TabLayoutNode | null {
      return this;
    }

    /**
     * Find the tab layout node which contains the local point.
     */
    hitTestTabNodes(x: number, y: number): TabLayoutNode | null {
      if (x < this._left || x >= this._left + this._width) {
        return null;
      }
      if (y < this._top || y >= this._top + this._height) {
        return null;
      }
      return this;
    }

    /**
     * Create a configuration object for the layout tree.
     */
    createConfig(): DockLayout.ITabAreaConfig {
      let widgets = this.tabBar.titles.map(title => title.owner);
      let currentIndex = this.tabBar.currentIndex;
      return { type: 'tab-area', widgets, currentIndex };
    }

    /**
     * Recursively hold all of the sizes in the layout tree.
     *
     * This ignores the sizers of tab layout nodes.
     */
    holdAllSizes(): void {
      return;
    }

    /**
     * Fit the layout tree.
     */
    fit(spacing: number, items: ItemMap): ElementExt.ISizeLimits {
      // Set up the limit variables.
      let minWidth = 0;
      let minHeight = 0;
      let maxWidth = Infinity;
      let maxHeight = Infinity;

      // Lookup the tab bar layout item.
      let tabBarItem = items.get(this.tabBar);

      // Lookup the widget layout item.
      let current = this.tabBar.currentTitle;
      let widgetItem = current ? items.get(current.owner) : undefined;

      // Lookup the tab bar and widget sizers.
      let [tabBarSizer, widgetSizer] = this.sizers;

      // Update the tab bar limits.
      if (tabBarItem) {
        tabBarItem.fit();
      }

      // Update the widget limits.
      if (widgetItem) {
        widgetItem.fit();
      }

      // Update the results and sizer for the tab bar.
      if (tabBarItem && !tabBarItem.isHidden) {
        minWidth = Math.max(minWidth, tabBarItem.minWidth);
        minHeight += tabBarItem.minHeight;
        tabBarSizer.minSize = tabBarItem.minHeight;
        tabBarSizer.maxSize = tabBarItem.maxHeight;
      } else {
        tabBarSizer.minSize = 0;
        tabBarSizer.maxSize = 0;
      }

      // Update the results and sizer for the current widget.
      if (widgetItem && !widgetItem.isHidden) {
        minWidth = Math.max(minWidth, widgetItem.minWidth);
        minHeight += widgetItem.minHeight;
        widgetSizer.minSize = widgetItem.minHeight;
        widgetSizer.maxSize = Infinity;
      } else {
        widgetSizer.minSize = 0;
        widgetSizer.maxSize = Infinity;
      }

      // Return the computed size limits for the layout node.
      return { minWidth, minHeight, maxWidth, maxHeight };
    }

    /**
     * Update the layout tree.
     */
    update(
      left: number,
      top: number,
      width: number,
      height: number,
      spacing: number,
      items: ItemMap
    ): void {
      // Update the layout box values.
      this._top = top;
      this._left = left;
      this._width = width;
      this._height = height;

      // Lookup the tab bar layout item.
      let tabBarItem = items.get(this.tabBar);

      // Lookup the widget layout item.
      let current = this.tabBar.currentTitle;
      let widgetItem = current ? items.get(current.owner) : undefined;

      // Distribute the layout space to the sizers.
      BoxEngine.calc(this.sizers, height);

      // Update the tab bar item using the computed size.
      if (tabBarItem && !tabBarItem.isHidden) {
        let size = this.sizers[0].size;
        tabBarItem.update(left, top, width, size);
        top += size;
      }

      // Layout the widget using the computed size.
      if (widgetItem && !widgetItem.isHidden) {
        let size = this.sizers[1].size;
        widgetItem.update(left, top, width, size);
      }
    }

    private _top = 0;
    private _left = 0;
    private _width = 0;
    private _height = 0;
  }

  /**
   * A layout node which holds the data for a split area.
   */
  export class SplitLayoutNode {
    /**
     * Construct a new split layout node.
     *
     * @param orientation - The orientation of the node.
     */
    constructor(orientation: Orientation) {
      this.orientation = orientation;
    }

    /**
     * The parent of the layout node.
     */
    parent: SplitLayoutNode | null = null;

    /**
     * Whether the sizers have been normalized.
     */
    normalized = false;

    /**
     * The orientation of the node.
     */
    readonly orientation: Orientation;

    /**
     * The child nodes for the split node.
     */
    readonly children: LayoutNode[] = [];

    /**
     * The box sizers for the layout children.
     */
    readonly sizers: BoxSizer[] = [];

    /**
     * The handles for the layout children.
     */
    readonly handles: HTMLDivElement[] = [];

    /**
     * Create an iterator for all widgets in the layout tree.
     */
    *iterAllWidgets(): IterableIterator<Widget> {
      for (const child of this.children) {
        yield* child.iterAllWidgets();
      }
    }

    /**
     * Create an iterator for the user widgets in the layout tree.
     */
    *iterUserWidgets(): IterableIterator<Widget> {
      for (const child of this.children) {
        yield* child.iterUserWidgets();
      }
    }

    /**
     * Create an iterator for the selected widgets in the layout tree.
     */
    *iterSelectedWidgets(): IterableIterator<Widget> {
      for (const child of this.children) {
        yield* child.iterSelectedWidgets();
      }
    }

    /**
     * Create an iterator for the tab bars in the layout tree.
     */
    *iterTabBars(): IterableIterator<TabBar<Widget>> {
      for (const child of this.children) {
        yield* child.iterTabBars();
      }
    }

    /**
     * Create an iterator for the handles in the layout tree.
     */
    *iterHandles(): IterableIterator<HTMLDivElement> {
      for (const child of this.children) {
        yield* child.iterHandles();
      }
    }

    /**
     * Find the tab layout node which contains the given widget.
     */
    findTabNode(widget: Widget): TabLayoutNode | null {
      for (let i = 0, n = this.children.length; i < n; ++i) {
        let result = this.children[i].findTabNode(widget);
        if (result) {
          return result;
        }
      }
      return null;
    }

    /**
     * Find the split layout node which contains the given handle.
     */
    findSplitNode(
      handle: HTMLDivElement
    ): { index: number; node: SplitLayoutNode } | null {
      let index = this.handles.indexOf(handle);
      if (index !== -1) {
        return { index, node: this };
      }
      for (let i = 0, n = this.children.length; i < n; ++i) {
        let result = this.children[i].findSplitNode(handle);
        if (result) {
          return result;
        }
      }
      return null;
    }

    /**
     * Find the first tab layout node in a layout tree.
     */
    findFirstTabNode(): TabLayoutNode | null {
      if (this.children.length === 0) {
        return null;
      }
      return this.children[0].findFirstTabNode();
    }

    /**
     * Find the tab layout node which contains the local point.
     */
    hitTestTabNodes(x: number, y: number): TabLayoutNode | null {
      for (let i = 0, n = this.children.length; i < n; ++i) {
        let result = this.children[i].hitTestTabNodes(x, y);
        if (result) {
          return result;
        }
      }
      return null;
    }

    /**
     * Create a configuration object for the layout tree.
     */
    createConfig(): DockLayout.ISplitAreaConfig {
      let orientation = this.orientation;
      let sizes = this.createNormalizedSizes();
      let children = this.children.map(child => child.createConfig());
      return { type: 'split-area', orientation, children, sizes };
    }

    /**
     * Sync the visibility and orientation of the handles.
     */
    syncHandles(): void {
      this.handles.forEach((handle, i) => {
        handle.setAttribute('data-orientation', this.orientation);
        if (i === this.handles.length - 1) {
          handle.classList.add('lm-mod-hidden');
        } else {
          handle.classList.remove('lm-mod-hidden');
        }
      });
    }

    /**
     * Hold the current sizes of the box sizers.
     *
     * This sets the size hint of each sizer to its current size.
     */
    holdSizes(): void {
      for (const sizer of this.sizers) {
        sizer.sizeHint = sizer.size;
      }
    }

    /**
     * Recursively hold all of the sizes in the layout tree.
     *
     * This ignores the sizers of tab layout nodes.
     */
    holdAllSizes(): void {
      for (const child of this.children) {
        child.holdAllSizes();
      }
      this.holdSizes();
    }

    /**
     * Normalize the sizes of the split layout node.
     */
    normalizeSizes(): void {
      // Bail early if the sizers are empty.
      let n = this.sizers.length;
      if (n === 0) {
        return;
      }

      // Hold the current sizes of the sizers.
      this.holdSizes();

      // Compute the sum of the sizes.
      let sum = this.sizers.reduce((v, sizer) => v + sizer.sizeHint, 0);

      // Normalize the sizes based on the sum.
      if (sum === 0) {
        for (const sizer of this.sizers) {
          sizer.size = sizer.sizeHint = 1 / n;
        }
      } else {
        for (const sizer of this.sizers) {
          sizer.size = sizer.sizeHint /= sum;
        }
      }

      // Mark the sizes as normalized.
      this.normalized = true;
    }

    /**
     * Snap the normalized sizes of the split layout node.
     */
    createNormalizedSizes(): number[] {
      // Bail early if the sizers are empty.
      let n = this.sizers.length;
      if (n === 0) {
        return [];
      }

      // Grab the current sizes of the sizers.
      let sizes = this.sizers.map(sizer => sizer.size);

      // Compute the sum of the sizes.
      let sum = sizes.reduce((v, size) => v + size, 0);

      // Normalize the sizes based on the sum.
      if (sum === 0) {
        for (let i = sizes.length - 1; i > -1; i--) {
          sizes[i] = 1 / n;
        }
      } else {
        for (let i = sizes.length - 1; i > -1; i--) {
          sizes[i] /= sum;
        }
      }

      // Return the normalized sizes.
      return sizes;
    }

    /**
     * Fit the layout tree.
     */
    fit(spacing: number, items: ItemMap): ElementExt.ISizeLimits {
      // Compute the required fixed space.
      let horizontal = this.orientation === 'horizontal';
      let fixed = Math.max(0, this.children.length - 1) * spacing;

      // Set up the limit variables.
      let minWidth = horizontal ? fixed : 0;
      let minHeight = horizontal ? 0 : fixed;
      let maxWidth = Infinity;
      let maxHeight = Infinity;

      // Fit the children and update the limits.
      for (let i = 0, n = this.children.length; i < n; ++i) {
        let limits = this.children[i].fit(spacing, items);
        if (horizontal) {
          minHeight = Math.max(minHeight, limits.minHeight);
          minWidth += limits.minWidth;
          this.sizers[i].minSize = limits.minWidth;
        } else {
          minWidth = Math.max(minWidth, limits.minWidth);
          minHeight += limits.minHeight;
          this.sizers[i].minSize = limits.minHeight;
        }
      }

      // Return the computed limits for the layout node.
      return { minWidth, minHeight, maxWidth, maxHeight };
    }

    /**
     * Update the layout tree.
     */
    update(
      left: number,
      top: number,
      width: number,
      height: number,
      spacing: number,
      items: ItemMap
    ): void {
      // Compute the available layout space.
      let horizontal = this.orientation === 'horizontal';
      let fixed = Math.max(0, this.children.length - 1) * spacing;
      let space = Math.max(0, (horizontal ? width : height) - fixed);

      // De-normalize the sizes if needed.
      if (this.normalized) {
        for (const sizer of this.sizers) {
          sizer.sizeHint *= space;
        }
        this.normalized = false;
      }

      // Distribute the layout space to the sizers.
      BoxEngine.calc(this.sizers, space);

      // Update the geometry of the child nodes and handles.
      for (let i = 0, n = this.children.length; i < n; ++i) {
        let child = this.children[i];
        let size = this.sizers[i].size;
        let handleStyle = this.handles[i].style;
        if (horizontal) {
          child.update(left, top, size, height, spacing, items);
          left += size;
          handleStyle.top = `${top}px`;
          handleStyle.left = `${left}px`;
          handleStyle.width = `${spacing}px`;
          handleStyle.height = `${height}px`;
          left += spacing;
        } else {
          child.update(left, top, width, size, spacing, items);
          top += size;
          handleStyle.top = `${top}px`;
          handleStyle.left = `${left}px`;
          handleStyle.width = `${width}px`;
          handleStyle.height = `${spacing}px`;
          top += spacing;
        }
      }
    }
  }

  export function addAria(widget: Widget, tabBar: TabBar<Widget>): void {
    widget.node.setAttribute('role', 'tabpanel');
    let renderer = tabBar.renderer;
    if (renderer instanceof TabBar.Renderer) {
      let tabId = renderer.createTabKey({
        title: widget.title,
        current: false,
        zIndex: 0
      });
      widget.node.setAttribute('aria-labelledby', tabId);
    }
  }

  export function removeAria(widget: Widget): void {
    widget.node.removeAttribute('role');
    widget.node.removeAttribute('aria-labelledby');
  }

  /**
   * Normalize a tab area config and collect the visited widgets.
   */
  function normalizeTabAreaConfig(
    config: DockLayout.ITabAreaConfig,
    widgetSet: Set<Widget>
  ): DockLayout.ITabAreaConfig | null {
    // Bail early if there is no content.
    if (config.widgets.length === 0) {
      return null;
    }

    // Setup the filtered widgets array.
    let widgets: Widget[] = [];

    // Filter the config for unique widgets.
    for (const widget of config.widgets) {
      if (!widgetSet.has(widget)) {
        widgetSet.add(widget);
        widgets.push(widget);
      }
    }

    // Bail if there are no effective widgets.
    if (widgets.length === 0) {
      return null;
    }

    // Normalize the current index.
    let index = config.currentIndex;
    if (index !== -1 && (index < 0 || index >= widgets.length)) {
      index = 0;
    }

    // Return a normalized config object.
    return { type: 'tab-area', widgets, currentIndex: index };
  }

  /**
   * Normalize a split area config and collect the visited widgets.
   */
  function normalizeSplitAreaConfig(
    config: DockLayout.ISplitAreaConfig,
    widgetSet: Set<Widget>
  ): DockLayout.AreaConfig | null {
    // Set up the result variables.
    let orientation = config.orientation;
    let children: DockLayout.AreaConfig[] = [];
    let sizes: number[] = [];

    // Normalize the config children.
    for (let i = 0, n = config.children.length; i < n; ++i) {
      // Normalize the child config.
      let child = normalizeAreaConfig(config.children[i], widgetSet);

      // Ignore an empty child.
      if (!child) {
        continue;
      }

      // Add the child or hoist its content as appropriate.
      if (child.type === 'tab-area' || child.orientation !== orientation) {
        children.push(child);
        sizes.push(Math.abs(config.sizes[i] || 0));
      } else {
        children.push(...child.children);
        sizes.push(...child.sizes);
      }
    }

    // Bail if there are no effective children.
    if (children.length === 0) {
      return null;
    }

    // If there is only one effective child, return that child.
    if (children.length === 1) {
      return children[0];
    }

    // Return a normalized config object.
    return { type: 'split-area', orientation, children, sizes };
  }

  /**
   * Convert a normalized tab area config into a layout tree.
   */
  function realizeTabAreaConfig(
    config: DockLayout.ITabAreaConfig,
    renderer: DockLayout.IRenderer,
    document: Document | ShadowRoot
  ): TabLayoutNode {
    // Create the tab bar for the layout node.
    let tabBar = renderer.createTabBar(document);

    // Hide each widget and add it to the tab bar.
    for (const widget of config.widgets) {
      widget.hide();
      tabBar.addTab(widget.title);
      Private.addAria(widget, tabBar);
    }

    // Set the current index of the tab bar.
    tabBar.currentIndex = config.currentIndex;

    // Return the new tab layout node.
    return new TabLayoutNode(tabBar);
  }

  /**
   * Convert a normalized split area config into a layout tree.
   */
  function realizeSplitAreaConfig(
    config: DockLayout.ISplitAreaConfig,
    renderer: DockLayout.IRenderer,
    document: Document | ShadowRoot
  ): SplitLayoutNode {
    // Create the split layout node.
    let node = new SplitLayoutNode(config.orientation);

    // Add each child to the layout node.
    config.children.forEach((child, i) => {
      // Create the child data for the layout node.
      let childNode = realizeAreaConfig(child, renderer, document);
      let sizer = createSizer(config.sizes[i]);
      let handle = renderer.createHandle();

      // Add the child data to the layout node.
      node.children.push(childNode);
      node.handles.push(handle);
      node.sizers.push(sizer);

      // Update the parent for the child node.
      childNode.parent = node;
    });

    // Synchronize the handle state for the layout node.
    node.syncHandles();

    // Normalize the sizes for the layout node.
    node.normalizeSizes();

    // Return the new layout node.
    return node;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { find } from '@lumino/algorithm';

import { MimeData } from '@lumino/coreutils';

import { IDisposable } from '@lumino/disposable';

import { ElementExt, Platform } from '@lumino/domutils';

import { Drag } from '@lumino/dragdrop';

import { ConflatableMessage, Message, MessageLoop } from '@lumino/messaging';

import { AttachedProperty } from '@lumino/properties';

import { ISignal, Signal } from '@lumino/signaling';

import { DockLayout } from './docklayout';

import { TabBar } from './tabbar';

import { Widget } from './widget';

/**
 * A widget which provides a flexible docking area for widgets.
 */
export class DockPanel extends Widget {
  /**
   * Construct a new dock panel.
   *
   * @param options - The options for initializing the panel.
   */
  constructor(options: DockPanel.IOptions = {}) {
    super();
    this.addClass('lm-DockPanel');
    this._document = options.document || document;
    this._mode = options.mode || 'multiple-document';
    this._renderer = options.renderer || DockPanel.defaultRenderer;
    this._edges = options.edges || Private.DEFAULT_EDGES;
    if (options.tabsMovable !== undefined) {
      this._tabsMovable = options.tabsMovable;
    }
    if (options.tabsConstrained !== undefined) {
      this._tabsConstrained = options.tabsConstrained;
    }
    if (options.addButtonEnabled !== undefined) {
      this._addButtonEnabled = options.addButtonEnabled;
    }

    // Toggle the CSS mode attribute.
    this.dataset['mode'] = this._mode;

    // Create the delegate renderer for the layout.
    let renderer: DockPanel.IRenderer = {
      createTabBar: () => this._createTabBar(),
      createHandle: () => this._createHandle()
    };

    // Set up the dock layout for the panel.
    this.layout = new DockLayout({
      document: this._document,
      renderer,
      spacing: options.spacing,
      hiddenMode: options.hiddenMode
    });

    // Set up the overlay drop indicator.
    this.overlay = options.overlay || new DockPanel.Overlay();
    this.node.appendChild(this.overlay.node);
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Hide the overlay.
    this.overlay.hide(0);

    // Cancel a drag if one is in progress.
    if (this._drag) {
      this._drag.dispose();
    }

    // Dispose of the base class.
    super.dispose();
  }

  /**
   * The method for hiding widgets.
   */
  get hiddenMode(): Widget.HiddenMode {
    return (this.layout as DockLayout).hiddenMode;
  }

  /**
   * Set the method for hiding widgets.
   */
  set hiddenMode(v: Widget.HiddenMode) {
    (this.layout as DockLayout).hiddenMode = v;
  }

  /**
   * A signal emitted when the layout configuration is modified.
   *
   * #### Notes
   * This signal is emitted whenever the current layout configuration
   * may have changed.
   *
   * This signal is emitted asynchronously in a collapsed fashion, so
   * that multiple synchronous modifications results in only a single
   * emit of the signal.
   */
  get layoutModified(): ISignal<this, void> {
    return this._layoutModified;
  }

  /**
   * A signal emitted when the add button on a tab bar is clicked.
   *
   */
  get addRequested(): ISignal<this, TabBar<Widget>> {
    return this._addRequested;
  }

  /**
   * The overlay used by the dock panel.
   */
  readonly overlay: DockPanel.IOverlay;

  /**
   * The renderer used by the dock panel.
   */
  get renderer(): DockPanel.IRenderer {
    return (this.layout as DockLayout).renderer;
  }

  /**
   * Get the spacing between the widgets.
   */
  get spacing(): number {
    return (this.layout as DockLayout).spacing;
  }

  /**
   * Set the spacing between the widgets.
   */
  set spacing(value: number) {
    (this.layout as DockLayout).spacing = value;
  }

  /**
   * Get the mode for the dock panel.
   */
  get mode(): DockPanel.Mode {
    return this._mode;
  }

  /**
   * Set the mode for the dock panel.
   *
   * #### Notes
   * Changing the mode is a destructive operation with respect to the
   * panel's layout configuration. If layout state must be preserved,
   * save the current layout config before changing the mode.
   */
  set mode(value: DockPanel.Mode) {
    // Bail early if the mode does not change.
    if (this._mode === value) {
      return;
    }

    // Update the internal mode.
    this._mode = value;

    // Toggle the CSS mode attribute.
    this.dataset['mode'] = value;

    // Get the layout for the panel.
    let layout = this.layout as DockLayout;

    // Configure the layout for the specified mode.
    switch (value) {
      case 'multiple-document':
        for (const tabBar of layout.tabBars()) {
          tabBar.show();
        }
        break;
      case 'single-document':
        layout.restoreLayout(Private.createSingleDocumentConfig(this));
        break;
      default:
        throw 'unreachable';
    }

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Whether the tabs can be dragged / moved at runtime.
   */
  get tabsMovable(): boolean {
    return this._tabsMovable;
  }

  /**
   * Enable / Disable draggable / movable tabs.
   */
  set tabsMovable(value: boolean) {
    this._tabsMovable = value;
    for (const tabBar of this.tabBars()) {
      tabBar.tabsMovable = value;
    }
  }

  /**
   * Whether the tabs are constrained to their source dock panel
   */
  get tabsConstrained(): boolean {
    return this._tabsConstrained;
  }

  /**
   * Constrain/Allow tabs to be dragged outside of this dock panel
   */
  set tabsConstrained(value: boolean) {
    this._tabsConstrained = value;
  }

  /**
   * Whether the add buttons for each tab bar are enabled.
   */
  get addButtonEnabled(): boolean {
    return this._addButtonEnabled;
  }

  /**
   * Set whether the add buttons for each tab bar are enabled.
   */
  set addButtonEnabled(value: boolean) {
    this._addButtonEnabled = value;
    for (const tabBar of this.tabBars()) {
      tabBar.addButtonEnabled = value;
    }
  }

  /**
   * Whether the dock panel is empty.
   */
  get isEmpty(): boolean {
    return (this.layout as DockLayout).isEmpty;
  }

  /**
   * Create an iterator over the user widgets in the panel.
   *
   * @returns A new iterator over the user widgets in the panel.
   *
   * #### Notes
   * This iterator does not include the generated tab bars.
   */
  *widgets(): IterableIterator<Widget> {
    yield* (this.layout as DockLayout).widgets();
  }

  /**
   * Create an iterator over the selected widgets in the panel.
   *
   * @returns A new iterator over the selected user widgets.
   *
   * #### Notes
   * This iterator yields the widgets corresponding to the current tab
   * of each tab bar in the panel.
   */
  *selectedWidgets(): IterableIterator<Widget> {
    yield* (this.layout as DockLayout).selectedWidgets();
  }

  /**
   * Create an iterator over the tab bars in the panel.
   *
   * @returns A new iterator over the tab bars in the panel.
   *
   * #### Notes
   * This iterator does not include the user widgets.
   */
  *tabBars(): IterableIterator<TabBar<Widget>> {
    yield* (this.layout as DockLayout).tabBars();
  }

  /**
   * Create an iterator over the handles in the panel.
   *
   * @returns A new iterator over the handles in the panel.
   */
  *handles(): IterableIterator<HTMLDivElement> {
    yield* (this.layout as DockLayout).handles();
  }

  /**
   * Select a specific widget in the dock panel.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This will make the widget the current widget in its tab area.
   */
  selectWidget(widget: Widget): void {
    // Find the tab bar which contains the widget.
    let tabBar = find(this.tabBars(), bar => {
      return bar.titles.indexOf(widget.title) !== -1;
    });

    // Throw an error if no tab bar is found.
    if (!tabBar) {
      throw new Error('Widget is not contained in the dock panel.');
    }

    // Ensure the widget is the current widget.
    tabBar.currentTitle = widget.title;
  }

  /**
   * Activate a specified widget in the dock panel.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This will select and activate the given widget.
   */
  activateWidget(widget: Widget): void {
    this.selectWidget(widget);
    widget.activate();
  }

  /**
   * Save the current layout configuration of the dock panel.
   *
   * @returns A new config object for the current layout state.
   *
   * #### Notes
   * The return value can be provided to the `restoreLayout` method
   * in order to restore the layout to its current configuration.
   */
  saveLayout(): DockPanel.ILayoutConfig {
    return (this.layout as DockLayout).saveLayout();
  }

  /**
   * Restore the layout to a previously saved configuration.
   *
   * @param config - The layout configuration to restore.
   *
   * #### Notes
   * Widgets which currently belong to the layout but which are not
   * contained in the config will be unparented.
   *
   * The dock panel automatically reverts to `'multiple-document'`
   * mode when a layout config is restored.
   */
  restoreLayout(config: DockPanel.ILayoutConfig): void {
    // Reset the mode.
    this._mode = 'multiple-document';

    // Restore the layout.
    (this.layout as DockLayout).restoreLayout(config);

    // Flush the message loop on IE and Edge to prevent flicker.
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush();
    }

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Add a widget to the dock panel.
   *
   * @param widget - The widget to add to the dock panel.
   *
   * @param options - The additional options for adding the widget.
   *
   * #### Notes
   * If the panel is in single document mode, the options are ignored
   * and the widget is always added as tab in the hidden tab bar.
   */
  addWidget(widget: Widget, options: DockPanel.IAddOptions = {}): void {
    // Add the widget to the layout.
    if (this._mode === 'single-document') {
      (this.layout as DockLayout).addWidget(widget);
    } else {
      (this.layout as DockLayout).addWidget(widget, options);
    }

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Process a message sent to the widget.
   *
   * @param msg - The message sent to the widget.
   */
  processMessage(msg: Message): void {
    if (msg.type === 'layout-modified') {
      this._layoutModified.emit(undefined);
    } else {
      super.processMessage(msg);
    }
  }

  /**
   * Handle the DOM events for the dock panel.
   *
   * @param event - The DOM event sent to the panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the panel's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'lm-dragenter':
        this._evtDragEnter(event as Drag.Event);
        break;
      case 'lm-dragleave':
        this._evtDragLeave(event as Drag.Event);
        break;
      case 'lm-dragover':
        this._evtDragOver(event as Drag.Event);
        break;
      case 'lm-drop':
        this._evtDrop(event as Drag.Event);
        break;
      case 'pointerdown':
        this._evtPointerDown(event as MouseEvent);
        break;
      case 'pointermove':
        this._evtPointerMove(event as MouseEvent);
        break;
      case 'pointerup':
        this._evtPointerUp(event as MouseEvent);
        break;
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
      case 'contextmenu':
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('lm-dragenter', this);
    this.node.addEventListener('lm-dragleave', this);
    this.node.addEventListener('lm-dragover', this);
    this.node.addEventListener('lm-drop', this);
    this.node.addEventListener('pointerdown', this);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('lm-dragenter', this);
    this.node.removeEventListener('lm-dragleave', this);
    this.node.removeEventListener('lm-dragover', this);
    this.node.removeEventListener('lm-drop', this);
    this.node.removeEventListener('pointerdown', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: Widget.ChildMessage): void {
    // Ignore the generated tab bars.
    if (Private.isGeneratedTabBarProperty.get(msg.child)) {
      return;
    }

    // Add the widget class to the child.
    msg.child.addClass('lm-DockPanel-widget');
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    // Ignore the generated tab bars.
    if (Private.isGeneratedTabBarProperty.get(msg.child)) {
      return;
    }

    // Remove the widget class from the child.
    msg.child.removeClass('lm-DockPanel-widget');

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Handle the `'lm-dragenter'` event for the dock panel.
   */
  private _evtDragEnter(event: Drag.Event): void {
    // If the factory mime type is present, mark the event as
    // handled in order to get the rest of the drag events.
    if (event.mimeData.hasData('application/vnd.lumino.widget-factory')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Handle the `'lm-dragleave'` event for the dock panel.
   */
  private _evtDragLeave(event: Drag.Event): void {
    // Mark the event as handled.
    event.preventDefault();
    event.stopPropagation();

    // The new target might be a descendant, so we might still handle the drop.
    // Hide asynchronously so that if a lm-dragover event bubbles up to us, the
    // hide is cancelled by the lm-dragover handler's show overlay logic.
    this.overlay.hide(1);
  }

  /**
   * Handle the `'lm-dragover'` event for the dock panel.
   */
  private _evtDragOver(event: Drag.Event): void {
    // Mark the event as handled.
    event.preventDefault();
    event.stopPropagation();

    // Show the drop indicator overlay and update the drop
    // action based on the drop target zone under the mouse.
    if (
      (this._tabsConstrained && event.source !== this) ||
      this._showOverlay(event.clientX, event.clientY) === 'invalid'
    ) {
      event.dropAction = 'none';
    } else {
      event.dropAction = event.proposedAction;
    }
  }

  /**
   * Handle the `'lm-drop'` event for the dock panel.
   */
  private _evtDrop(event: Drag.Event): void {
    // Mark the event as handled.
    event.preventDefault();
    event.stopPropagation();

    // Hide the drop indicator overlay.
    this.overlay.hide(0);

    // Bail if the proposed action is to do nothing.
    if (event.proposedAction === 'none') {
      event.dropAction = 'none';
      return;
    }

    // Find the drop target under the mouse.
    let { clientX, clientY } = event;
    let { zone, target } = Private.findDropTarget(
      this,
      clientX,
      clientY,
      this._edges
    );

    // Bail if the drop zone is invalid.
    if (zone === 'invalid') {
      event.dropAction = 'none';
      return;
    }

    // Bail if the factory mime type has invalid data.
    let mimeData = event.mimeData;
    let factory = mimeData.getData('application/vnd.lumino.widget-factory');
    if (typeof factory !== 'function') {
      event.dropAction = 'none';
      return;
    }

    // Bail if the factory does not produce a widget.
    let widget = factory();
    if (!(widget instanceof Widget)) {
      event.dropAction = 'none';
      return;
    }

    // Bail if the widget is an ancestor of the dock panel.
    if (widget.contains(this)) {
      event.dropAction = 'none';
      return;
    }

    // Find the reference widget for the drop target.
    let ref = target ? Private.getDropRef(target.tabBar) : null;

    // Add the widget according to the indicated drop zone.
    switch (zone) {
      case 'root-all':
        this.addWidget(widget);
        break;
      case 'root-top':
        this.addWidget(widget, { mode: 'split-top' });
        break;
      case 'root-left':
        this.addWidget(widget, { mode: 'split-left' });
        break;
      case 'root-right':
        this.addWidget(widget, { mode: 'split-right' });
        break;
      case 'root-bottom':
        this.addWidget(widget, { mode: 'split-bottom' });
        break;
      case 'widget-all':
        this.addWidget(widget, { mode: 'tab-after', ref });
        break;
      case 'widget-top':
        this.addWidget(widget, { mode: 'split-top', ref });
        break;
      case 'widget-left':
        this.addWidget(widget, { mode: 'split-left', ref });
        break;
      case 'widget-right':
        this.addWidget(widget, { mode: 'split-right', ref });
        break;
      case 'widget-bottom':
        this.addWidget(widget, { mode: 'split-bottom', ref });
        break;
      case 'widget-tab':
        this.addWidget(widget, { mode: 'tab-after', ref });
        break;
      default:
        throw 'unreachable';
    }

    // Accept the proposed drop action.
    event.dropAction = event.proposedAction;

    // Activate the dropped widget.
    this.activateWidget(widget);
  }

  /**
   * Handle the `'keydown'` event for the dock panel.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) {
      // Finalize the mouse release.
      this._releaseMouse();

      // Schedule an emit of the layout modified signal.
      MessageLoop.postMessage(this, Private.LayoutModified);
    }
  }

  /**
   * Handle the `'pointerdown'` event for the dock panel.
   */
  private _evtPointerDown(event: MouseEvent): void {
    // Do nothing if the left mouse button is not pressed.
    if (event.button !== 0) {
      return;
    }

    // Find the handle which contains the mouse target, if any.
    let layout = this.layout as DockLayout;
    let target = event.target as HTMLElement;
    let handle = find(layout.handles(), handle => handle.contains(target));
    if (!handle) {
      return;
    }

    // Stop the event when a handle is pressed.
    event.preventDefault();
    event.stopPropagation();

    // Add the extra document listeners.
    this._document.addEventListener('keydown', this, true);
    this._document.addEventListener('pointerup', this, true);
    this._document.addEventListener('pointermove', this, true);
    this._document.addEventListener('contextmenu', this, true);

    // Compute the offset deltas for the handle press.
    let rect = handle.getBoundingClientRect();
    let deltaX = event.clientX - rect.left;
    let deltaY = event.clientY - rect.top;

    // Override the cursor and store the press data.
    let style = window.getComputedStyle(handle);
    let override = Drag.overrideCursor(style.cursor!, this._document);
    this._pressData = { handle, deltaX, deltaY, override };
  }

  /**
   * Handle the `'pointermove'` event for the dock panel.
   */
  private _evtPointerMove(event: MouseEvent): void {
    // Bail early if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Stop the event when dragging a handle.
    event.preventDefault();
    event.stopPropagation();

    // Compute the desired offset position for the handle.
    let rect = this.node.getBoundingClientRect();
    let xPos = event.clientX - rect.left - this._pressData.deltaX;
    let yPos = event.clientY - rect.top - this._pressData.deltaY;

    // Set the handle as close to the desired position as possible.
    let layout = this.layout as DockLayout;
    layout.moveHandle(this._pressData.handle, xPos, yPos);
  }

  /**
   * Handle the `'pointerup'` event for the dock panel.
   */
  private _evtPointerUp(event: MouseEvent): void {
    // Do nothing if the left mouse button is not released.
    if (event.button !== 0) {
      return;
    }

    // Stop the event when releasing a handle.
    event.preventDefault();
    event.stopPropagation();

    // Finalize the mouse release.
    this._releaseMouse();

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Release the mouse grab for the dock panel.
   */
  private _releaseMouse(): void {
    // Bail early if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Clear the override cursor.
    this._pressData.override.dispose();
    this._pressData = null;

    // Remove the extra document listeners.
    this._document.removeEventListener('keydown', this, true);
    this._document.removeEventListener('pointerup', this, true);
    this._document.removeEventListener('pointermove', this, true);
    this._document.removeEventListener('contextmenu', this, true);
  }

  /**
   * Show the overlay indicator at the given client position.
   *
   * Returns the drop zone at the specified client position.
   *
   * #### Notes
   * If the position is not over a valid zone, the overlay is hidden.
   */
  private _showOverlay(clientX: number, clientY: number): Private.DropZone {
    // Find the dock target for the given client position.
    let { zone, target } = Private.findDropTarget(
      this,
      clientX,
      clientY,
      this._edges
    );

    // If the drop zone is invalid, hide the overlay and bail.
    if (zone === 'invalid') {
      this.overlay.hide(100);
      return zone;
    }

    // Setup the variables needed to compute the overlay geometry.
    let top: number;
    let left: number;
    let right: number;
    let bottom: number;
    let box = ElementExt.boxSizing(this.node); // TODO cache this?
    let rect = this.node.getBoundingClientRect();

    // Compute the overlay geometry based on the dock zone.
    switch (zone) {
      case 'root-all':
        top = box.paddingTop;
        left = box.paddingLeft;
        right = box.paddingRight;
        bottom = box.paddingBottom;
        break;
      case 'root-top':
        top = box.paddingTop;
        left = box.paddingLeft;
        right = box.paddingRight;
        bottom = rect.height * Private.GOLDEN_RATIO;
        break;
      case 'root-left':
        top = box.paddingTop;
        left = box.paddingLeft;
        right = rect.width * Private.GOLDEN_RATIO;
        bottom = box.paddingBottom;
        break;
      case 'root-right':
        top = box.paddingTop;
        left = rect.width * Private.GOLDEN_RATIO;
        right = box.paddingRight;
        bottom = box.paddingBottom;
        break;
      case 'root-bottom':
        top = rect.height * Private.GOLDEN_RATIO;
        left = box.paddingLeft;
        right = box.paddingRight;
        bottom = box.paddingBottom;
        break;
      case 'widget-all':
        top = target!.top;
        left = target!.left;
        right = target!.right;
        bottom = target!.bottom;
        break;
      case 'widget-top':
        top = target!.top;
        left = target!.left;
        right = target!.right;
        bottom = target!.bottom + target!.height / 2;
        break;
      case 'widget-left':
        top = target!.top;
        left = target!.left;
        right = target!.right + target!.width / 2;
        bottom = target!.bottom;
        break;
      case 'widget-right':
        top = target!.top;
        left = target!.left + target!.width / 2;
        right = target!.right;
        bottom = target!.bottom;
        break;
      case 'widget-bottom':
        top = target!.top + target!.height / 2;
        left = target!.left;
        right = target!.right;
        bottom = target!.bottom;
        break;
      case 'widget-tab': {
        const tabHeight = target!.tabBar.node.getBoundingClientRect().height;
        top = target!.top;
        left = target!.left;
        right = target!.right;
        bottom = target!.bottom + target!.height - tabHeight;
        break;
      }
      default:
        throw 'unreachable';
    }

    // Show the overlay with the computed geometry.
    this.overlay.show({ top, left, right, bottom });

    // Finally, return the computed drop zone.
    return zone;
  }

  /**
   * Create a new tab bar for use by the panel.
   */
  private _createTabBar(): TabBar<Widget> {
    // Create the tab bar.
    let tabBar = this._renderer.createTabBar(this._document);

    // Set the generated tab bar property for the tab bar.
    Private.isGeneratedTabBarProperty.set(tabBar, true);

    // Hide the tab bar when in single document mode.
    if (this._mode === 'single-document') {
      tabBar.hide();
    }

    // Enforce necessary tab bar behavior.
    // TODO do we really want to enforce *all* of these?
    tabBar.tabsMovable = this._tabsMovable;
    tabBar.allowDeselect = false;
    tabBar.addButtonEnabled = this._addButtonEnabled;
    tabBar.removeBehavior = 'select-previous-tab';
    tabBar.insertBehavior = 'select-tab-if-needed';

    // Connect the signal handlers for the tab bar.
    tabBar.tabMoved.connect(this._onTabMoved, this);
    tabBar.currentChanged.connect(this._onCurrentChanged, this);
    tabBar.tabCloseRequested.connect(this._onTabCloseRequested, this);
    tabBar.tabDetachRequested.connect(this._onTabDetachRequested, this);
    tabBar.tabActivateRequested.connect(this._onTabActivateRequested, this);
    tabBar.addRequested.connect(this._onTabAddRequested, this);

    // Return the initialized tab bar.
    return tabBar;
  }

  /**
   * Create a new handle for use by the panel.
   */
  private _createHandle(): HTMLDivElement {
    return this._renderer.createHandle();
  }

  /**
   * Handle the `tabMoved` signal from a tab bar.
   */
  private _onTabMoved(): void {
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Handle the `currentChanged` signal from a tab bar.
   */
  private _onCurrentChanged(
    sender: TabBar<Widget>,
    args: TabBar.ICurrentChangedArgs<Widget>
  ): void {
    // Extract the previous and current title from the args.
    let { previousTitle, currentTitle } = args;

    // Hide the previous widget.
    if (previousTitle) {
      previousTitle.owner.hide();
    }

    // Show the current widget.
    if (currentTitle) {
      currentTitle.owner.show();
    }

    // Flush the message loop on IE and Edge to prevent flicker.
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush();
    }

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Handle the `addRequested` signal from a tab bar.
   */
  private _onTabAddRequested(sender: TabBar<Widget>): void {
    this._addRequested.emit(sender);
  }

  /**
   * Handle the `tabActivateRequested` signal from a tab bar.
   */
  private _onTabActivateRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabActivateRequestedArgs<Widget>
  ): void {
    args.title.owner.activate();
  }

  /**
   * Handle the `tabCloseRequested` signal from a tab bar.
   */
  private _onTabCloseRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabCloseRequestedArgs<Widget>
  ): void {
    args.title.owner.close();
  }

  /**
   * Handle the `tabDetachRequested` signal from a tab bar.
   */
  private _onTabDetachRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabDetachRequestedArgs<Widget>
  ): void {
    // Do nothing if a drag is already in progress.
    if (this._drag) {
      return;
    }

    // Release the tab bar's hold on the mouse.
    sender.releaseMouse();

    // Extract the data from the args.
    let { title, tab, clientX, clientY } = args;

    // Setup the mime data for the drag operation.
    let mimeData = new MimeData();
    let factory = () => title.owner;
    mimeData.setData('application/vnd.lumino.widget-factory', factory);

    // Create the drag image for the drag operation.
    let dragImage = tab.cloneNode(true) as HTMLElement;

    // Create the drag object to manage the drag-drop operation.
    this._drag = new Drag({
      document: this._document,
      mimeData,
      dragImage,
      proposedAction: 'move',
      supportedActions: 'move',
      source: this
    });

    // Hide the tab node in the original tab.
    tab.classList.add('lm-mod-hidden');
    let cleanup = () => {
      this._drag = null;
      tab.classList.remove('lm-mod-hidden');
    };

    // Start the drag operation and cleanup when done.
    this._drag.start(clientX, clientY).then(cleanup);
  }

  private _edges: DockPanel.IEdges;
  private _document: Document | ShadowRoot;
  private _mode: DockPanel.Mode;
  private _drag: Drag | null = null;
  private _renderer: DockPanel.IRenderer;
  private _tabsMovable: boolean = true;
  private _tabsConstrained: boolean = false;
  private _addButtonEnabled: boolean = false;
  private _pressData: Private.IPressData | null = null;
  private _layoutModified = new Signal<this, void>(this);

  private _addRequested = new Signal<this, TabBar<Widget>>(this);
}

/**
 * The namespace for the `DockPanel` class statics.
 */
export namespace DockPanel {
  /**
   * An options object for creating a dock panel.
   */
  export interface IOptions {
    /**
     * The document to use with the dock panel.
     *
     * The default is the global `document` instance.
     */

    document?: Document | ShadowRoot;
    /**
     * The overlay to use with the dock panel.
     *
     * The default is a new `Overlay` instance.
     */
    overlay?: IOverlay;

    /**
     * The renderer to use for the dock panel.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;

    /**
     * The spacing between the items in the panel.
     *
     * The default is `4`.
     */
    spacing?: number;

    /**
     * The mode for the dock panel.
     *
     * The default is `'multiple-document'`.
     */
    mode?: DockPanel.Mode;

    /**
     * The sizes of the edge drop zones, in pixels.
     * If not given, default values will be used.
     */
    edges?: IEdges;

    /**
     * The method for hiding widgets.
     *
     * The default is `Widget.HiddenMode.Display`.
     */
    hiddenMode?: Widget.HiddenMode;

    /**
     * Allow tabs to be draggable / movable by user.
     *
     * The default is `'true'`.
     */
    tabsMovable?: boolean;

    /**
     * Constrain tabs to this dock panel
     *
     * The default is `'false'`.
     */
    tabsConstrained?: boolean;

    /**
     * Enable add buttons in each of the dock panel's tab bars.
     *
     * The default is `'false'`.
     */
    addButtonEnabled?: boolean;
  }

  /**
   * The sizes of the edge drop zones, in pixels.
   */
  export interface IEdges {
    /**
     * The size of the top edge drop zone.
     */
    top: number;

    /**
     * The size of the right edge drop zone.
     */
    right: number;

    /**
     * The size of the bottom edge drop zone.
     */
    bottom: number;

    /**
     * The size of the left edge drop zone.
     */
    left: number;
  }

  /**
   * A type alias for the supported dock panel modes.
   */
  export type Mode =
    | /**
     * The single document mode.
     *
     * In this mode, only a single widget is visible at a time, and that
     * widget fills the available layout space. No tab bars are visible.
     */
    'single-document'

    /**
     * The multiple document mode.
     *
     * In this mode, multiple documents are displayed in separate tab
     * areas, and those areas can be individually resized by the user.
     */
    | 'multiple-document';

  /**
   * A type alias for a layout configuration object.
   */
  export type ILayoutConfig = DockLayout.ILayoutConfig;

  /**
   * A type alias for the supported insertion modes.
   */
  export type InsertMode = DockLayout.InsertMode;

  /**
   * A type alias for the add widget options.
   */
  export type IAddOptions = DockLayout.IAddOptions;

  /**
   * An object which holds the geometry for overlay positioning.
   */
  export interface IOverlayGeometry {
    /**
     * The distance between the overlay and parent top edges.
     */
    top: number;

    /**
     * The distance between the overlay and parent left edges.
     */
    left: number;

    /**
     * The distance between the overlay and parent right edges.
     */
    right: number;

    /**
     * The distance between the overlay and parent bottom edges.
     */
    bottom: number;
  }

  /**
   * An object which manages the overlay node for a dock panel.
   */
  export interface IOverlay {
    /**
     * The DOM node for the overlay.
     */
    readonly node: HTMLDivElement;

    /**
     * Show the overlay using the given overlay geometry.
     *
     * @param geo - The desired geometry for the overlay.
     *
     * #### Notes
     * The given geometry values assume the node will use absolute
     * positioning.
     *
     * This is called on every mouse move event during a drag in order
     * to update the position of the overlay. It should be efficient.
     */
    show(geo: IOverlayGeometry): void;

    /**
     * Hide the overlay node.
     *
     * @param delay - The delay (in ms) before hiding the overlay.
     *   A delay value <= 0 should hide the overlay immediately.
     *
     * #### Notes
     * This is called whenever the overlay node should been hidden.
     */
    hide(delay: number): void;
  }

  /**
   * A concrete implementation of `IOverlay`.
   *
   * This is the default overlay implementation for a dock panel.
   */
  export class Overlay implements IOverlay {
    /**
     * Construct a new overlay.
     */
    constructor() {
      this.node = document.createElement('div');
      this.node.classList.add('lm-DockPanel-overlay');
      this.node.classList.add('lm-mod-hidden');
      this.node.style.position = 'absolute';
    }

    /**
     * The DOM node for the overlay.
     */
    readonly node: HTMLDivElement;

    /**
     * Show the overlay using the given overlay geometry.
     *
     * @param geo - The desired geometry for the overlay.
     */
    show(geo: IOverlayGeometry): void {
      // Update the position of the overlay.
      let style = this.node.style;
      style.top = `${geo.top}px`;
      style.left = `${geo.left}px`;
      style.right = `${geo.right}px`;
      style.bottom = `${geo.bottom}px`;

      // Clear any pending hide timer.
      clearTimeout(this._timer);
      this._timer = -1;

      // If the overlay is already visible, we're done.
      if (!this._hidden) {
        return;
      }

      // Clear the hidden flag.
      this._hidden = false;

      // Finally, show the overlay.
      this.node.classList.remove('lm-mod-hidden');
    }

    /**
     * Hide the overlay node.
     *
     * @param delay - The delay (in ms) before hiding the overlay.
     *   A delay value <= 0 will hide the overlay immediately.
     */
    hide(delay: number): void {
      // Do nothing if the overlay is already hidden.
      if (this._hidden) {
        return;
      }

      // Hide immediately if the delay is <= 0.
      if (delay <= 0) {
        clearTimeout(this._timer);
        this._timer = -1;
        this._hidden = true;
        this.node.classList.add('lm-mod-hidden');
        return;
      }

      // Do nothing if a hide is already pending.
      if (this._timer !== -1) {
        return;
      }

      // Otherwise setup the hide timer.
      this._timer = window.setTimeout(() => {
        this._timer = -1;
        this._hidden = true;
        this.node.classList.add('lm-mod-hidden');
      }, delay);
    }

    private _timer = -1;
    private _hidden = true;
  }

  /**
   * A type alias for a dock panel renderer;
   */
  export type IRenderer = DockLayout.IRenderer;

  /**
   * The default implementation of `IRenderer`.
   */
  export class Renderer implements IRenderer {
    /**
     * Create a new tab bar for use with a dock panel.
     *
     * @returns A new tab bar for a dock panel.
     */
    createTabBar(document?: Document | ShadowRoot): TabBar<Widget> {
      let bar = new TabBar<Widget>({ document });
      bar.addClass('lm-DockPanel-tabBar');
      return bar;
    }

    /**
     * Create a new handle node for use with a dock panel.
     *
     * @returns A new handle node for a dock panel.
     */
    createHandle(): HTMLDivElement {
      let handle = document.createElement('div');
      handle.className = 'lm-DockPanel-handle';
      return handle;
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export const defaultRenderer = new Renderer();
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A fraction used for sizing root panels; ~= `1 / golden_ratio`.
   */
  export const GOLDEN_RATIO = 0.618;

  /**
   * The default sizes for the edge drop zones, in pixels.
   */
  export const DEFAULT_EDGES = {
    /**
     * The size of the top edge dock zone for the root panel, in pixels.
     * This is different from the others to distinguish between the top
     * tab bar and the top root zone.
     */
    top: 12,

    /**
     * The size of the edge dock zone for the root panel, in pixels.
     */
    right: 40,

    /**
     * The size of the edge dock zone for the root panel, in pixels.
     */
    bottom: 40,

    /**
     * The size of the edge dock zone for the root panel, in pixels.
     */
    left: 40
  };

  /**
   * A singleton `'layout-modified'` conflatable message.
   */
  export const LayoutModified = new ConflatableMessage('layout-modified');

  /**
   * An object which holds mouse press data.
   */
  export interface IPressData {
    /**
     * The handle which was pressed.
     */
    handle: HTMLDivElement;

    /**
     * The X offset of the press in handle coordinates.
     */
    deltaX: number;

    /**
     * The Y offset of the press in handle coordinates.
     */
    deltaY: number;

    /**
     * The disposable which will clear the override cursor.
     */
    override: IDisposable;
  }

  /**
   * A type alias for a drop zone.
   */
  export type DropZone =
    | /**
     * An invalid drop zone.
     */
    'invalid'

    /**
     * The entirety of the root dock area.
     */
    | 'root-all'

    /**
     * The top portion of the root dock area.
     */
    | 'root-top'

    /**
     * The left portion of the root dock area.
     */
    | 'root-left'

    /**
     * The right portion of the root dock area.
     */
    | 'root-right'

    /**
     * The bottom portion of the root dock area.
     */
    | 'root-bottom'

    /**
     * The entirety of a tabbed widget area.
     */
    | 'widget-all'

    /**
     * The top portion of tabbed widget area.
     */
    | 'widget-top'

    /**
     * The left portion of tabbed widget area.
     */
    | 'widget-left'

    /**
     * The right portion of tabbed widget area.
     */
    | 'widget-right'

    /**
     * The bottom portion of tabbed widget area.
     */
    | 'widget-bottom'

    /**
     * The the bar of a tabbed widget area.
     */
    | 'widget-tab';

  /**
   * An object which holds the drop target zone and widget.
   */
  export interface IDropTarget {
    /**
     * The semantic zone for the mouse position.
     */
    zone: DropZone;

    /**
     * The tab area geometry for the drop zone, or `null`.
     */
    target: DockLayout.ITabAreaGeometry | null;
  }

  /**
   * An attached property used to track generated tab bars.
   */
  export const isGeneratedTabBarProperty = new AttachedProperty<
    Widget,
    boolean
  >({
    name: 'isGeneratedTabBar',
    create: () => false
  });

  /**
   * Create a single document config for the widgets in a dock panel.
   */
  export function createSingleDocumentConfig(
    panel: DockPanel
  ): DockPanel.ILayoutConfig {
    // Return an empty config if the panel is empty.
    if (panel.isEmpty) {
      return { main: null };
    }

    // Get a flat array of the widgets in the panel.
    let widgets = Array.from(panel.widgets());

    // Get the first selected widget in the panel.
    let selected = panel.selectedWidgets().next().value;

    // Compute the current index for the new config.
    let currentIndex = selected ? widgets.indexOf(selected) : -1;

    // Return the single document config.
    return { main: { type: 'tab-area', widgets, currentIndex } };
  }

  /**
   * Find the drop target at the given client position.
   */
  export function findDropTarget(
    panel: DockPanel,
    clientX: number,
    clientY: number,
    edges: DockPanel.IEdges
  ): IDropTarget {
    // Bail if the mouse is not over the dock panel.
    if (!ElementExt.hitTest(panel.node, clientX, clientY)) {
      return { zone: 'invalid', target: null };
    }

    // Look up the layout for the panel.
    let layout = panel.layout as DockLayout;

    // If the layout is empty, indicate the entire root drop zone.
    if (layout.isEmpty) {
      return { zone: 'root-all', target: null };
    }

    // Test the edge zones when in multiple document mode.
    if (panel.mode === 'multiple-document') {
      // Get the client rect for the dock panel.
      let panelRect = panel.node.getBoundingClientRect();

      // Compute the distance to each edge of the panel.
      let pl = clientX - panelRect.left + 1;
      let pt = clientY - panelRect.top + 1;
      let pr = panelRect.right - clientX;
      let pb = panelRect.bottom - clientY;

      // Find the minimum distance to an edge.
      let pd = Math.min(pt, pr, pb, pl);

      // Return a root zone if the mouse is within an edge.
      switch (pd) {
        case pt:
          if (pt < edges.top) {
            return { zone: 'root-top', target: null };
          }
          break;
        case pr:
          if (pr < edges.right) {
            return { zone: 'root-right', target: null };
          }
          break;
        case pb:
          if (pb < edges.bottom) {
            return { zone: 'root-bottom', target: null };
          }
          break;
        case pl:
          if (pl < edges.left) {
            return { zone: 'root-left', target: null };
          }
          break;
        default:
          throw 'unreachable';
      }
    }

    // Hit test the dock layout at the given client position.
    let target = layout.hitTestTabAreas(clientX, clientY);

    // Bail if no target area was found.
    if (!target) {
      return { zone: 'invalid', target: null };
    }

    // Return the whole tab area when in single document mode.
    if (panel.mode === 'single-document') {
      return { zone: 'widget-all', target };
    }

    // Compute the distance to each edge of the tab area.
    let al = target.x - target.left + 1;
    let at = target.y - target.top + 1;
    let ar = target.left + target.width - target.x;
    let ab = target.top + target.height - target.y;

    const tabHeight = target.tabBar.node.getBoundingClientRect().height;
    if (at < tabHeight) {
      return { zone: 'widget-tab', target };
    }

    // Get the X and Y edge sizes for the area.
    let rx = Math.round(target.width / 3);
    let ry = Math.round(target.height / 3);

    // If the mouse is not within an edge, indicate the entire area.
    if (al > rx && ar > rx && at > ry && ab > ry) {
      return { zone: 'widget-all', target };
    }

    // Scale the distances by the slenderness ratio.
    al /= rx;
    at /= ry;
    ar /= rx;
    ab /= ry;

    // Find the minimum distance to the area edge.
    let ad = Math.min(al, at, ar, ab);

    // Find the widget zone for the area edge.
    let zone: DropZone;
    switch (ad) {
      case al:
        zone = 'widget-left';
        break;
      case at:
        zone = 'widget-top';
        break;
      case ar:
        zone = 'widget-right';
        break;
      case ab:
        zone = 'widget-bottom';
        break;
      default:
        throw 'unreachable';
    }

    // Return the final drop target.
    return { zone, target };
  }

  /**
   * Get the drop reference widget for a tab bar.
   */
  export function getDropRef(tabBar: TabBar<Widget>): Widget | null {
    if (tabBar.titles.length === 0) {
      return null;
    }
    if (tabBar.currentTitle) {
      return tabBar.currentTitle.owner;
    }
    return tabBar.titles[tabBar.titles.length - 1].owner;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt, find, max } from '@lumino/algorithm';

import { IDisposable } from '@lumino/disposable';

import { ISignal, Signal } from '@lumino/signaling';

import { Widget } from './widget';

/**
 * A class which tracks focus among a set of widgets.
 *
 * This class is useful when code needs to keep track of the most
 * recently focused widget(s) among a set of related widgets.
 */
export class FocusTracker<T extends Widget> implements IDisposable {
  /**
   * Dispose of the resources held by the tracker.
   */
  dispose(): void {
    // Do nothing if the tracker is already disposed.
    if (this._counter < 0) {
      return;
    }

    // Mark the tracker as disposed.
    this._counter = -1;

    // Clear the connections for the tracker.
    Signal.clearData(this);

    // Remove all event listeners.
    for (const widget of this._widgets) {
      widget.node.removeEventListener('focus', this, true);
      widget.node.removeEventListener('blur', this, true);
    }

    // Clear the internal data structures.
    this._activeWidget = null;
    this._currentWidget = null;
    this._nodes.clear();
    this._numbers.clear();
    this._widgets.length = 0;
  }

  /**
   * A signal emitted when the current widget has changed.
   */
  get currentChanged(): ISignal<this, FocusTracker.IChangedArgs<T>> {
    return this._currentChanged;
  }

  /**
   * A signal emitted when the active widget has changed.
   */
  get activeChanged(): ISignal<this, FocusTracker.IChangedArgs<T>> {
    return this._activeChanged;
  }

  /**
   * A flag indicating whether the tracker is disposed.
   */
  get isDisposed(): boolean {
    return this._counter < 0;
  }

  /**
   * The current widget in the tracker.
   *
   * #### Notes
   * The current widget is the widget among the tracked widgets which
   * has the *descendant node* which has most recently been focused.
   *
   * The current widget will not be updated if the node loses focus. It
   * will only be updated when a different tracked widget gains focus.
   *
   * If the current widget is removed from the tracker, the previous
   * current widget will be restored.
   *
   * This behavior is intended to follow a user's conceptual model of
   * a semantically "current" widget, where the "last thing of type X"
   * to be interacted with is the "current instance of X", regardless
   * of whether that instance still has focus.
   */
  get currentWidget(): T | null {
    return this._currentWidget;
  }

  /**
   * The active widget in the tracker.
   *
   * #### Notes
   * The active widget is the widget among the tracked widgets which
   * has the *descendant node* which is currently focused.
   */
  get activeWidget(): T | null {
    return this._activeWidget;
  }

  /**
   * A read only array of the widgets being tracked.
   */
  get widgets(): ReadonlyArray<T> {
    return this._widgets;
  }

  /**
   * Get the focus number for a particular widget in the tracker.
   *
   * @param widget - The widget of interest.
   *
   * @returns The focus number for the given widget, or `-1` if the
   *   widget has not had focus since being added to the tracker, or
   *   is not contained by the tracker.
   *
   * #### Notes
   * The focus number indicates the relative order in which the widgets
   * have gained focus. A widget with a larger number has gained focus
   * more recently than a widget with a smaller number.
   *
   * The `currentWidget` will always have the largest focus number.
   *
   * All widgets start with a focus number of `-1`, which indicates that
   * the widget has not been focused since being added to the tracker.
   */
  focusNumber(widget: T): number {
    let n = this._numbers.get(widget);
    return n === undefined ? -1 : n;
  }

  /**
   * Test whether the focus tracker contains a given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns `true` if the widget is tracked, `false` otherwise.
   */
  has(widget: T): boolean {
    return this._numbers.has(widget);
  }

  /**
   * Add a widget to the focus tracker.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * A widget will be automatically removed from the tracker if it
   * is disposed after being added.
   *
   * If the widget is already tracked, this is a no-op.
   */
  add(widget: T): void {
    // Do nothing if the widget is already tracked.
    if (this._numbers.has(widget)) {
      return;
    }

    // Test whether the widget has focus.
    let focused = widget.node.contains(document.activeElement);

    // Set up the initial focus number.
    let n = focused ? this._counter++ : -1;

    // Add the widget to the internal data structures.
    this._widgets.push(widget);
    this._numbers.set(widget, n);
    this._nodes.set(widget.node, widget);

    // Set up the event listeners. The capturing phase must be used
    // since the 'focus' and 'blur' events don't bubble and Firefox
    // doesn't support the 'focusin' or 'focusout' events.
    widget.node.addEventListener('focus', this, true);
    widget.node.addEventListener('blur', this, true);

    // Connect the disposed signal handler.
    widget.disposed.connect(this._onWidgetDisposed, this);

    // Set the current and active widgets if needed.
    if (focused) {
      this._setWidgets(widget, widget);
    }
  }

  /**
   * Remove a widget from the focus tracker.
   *
   * #### Notes
   * If the widget is the `currentWidget`, the previous current widget
   * will become the new `currentWidget`.
   *
   * A widget will be automatically removed from the tracker if it
   * is disposed after being added.
   *
   * If the widget is not tracked, this is a no-op.
   */
  remove(widget: T): void {
    // Bail early if the widget is not tracked.
    if (!this._numbers.has(widget)) {
      return;
    }

    // Disconnect the disposed signal handler.
    widget.disposed.disconnect(this._onWidgetDisposed, this);

    // Remove the event listeners.
    widget.node.removeEventListener('focus', this, true);
    widget.node.removeEventListener('blur', this, true);

    // Remove the widget from the internal data structures.
    ArrayExt.removeFirstOf(this._widgets, widget);
    this._nodes.delete(widget.node);
    this._numbers.delete(widget);

    // Bail early if the widget is not the current widget.
    if (this._currentWidget !== widget) {
      return;
    }

    // Filter the widgets for those which have had focus.
    let valid = this._widgets.filter(w => this._numbers.get(w) !== -1);

    // Get the valid widget with the max focus number.
    let previous =
      max(valid, (first, second) => {
        let a = this._numbers.get(first)!;
        let b = this._numbers.get(second)!;
        return a - b;
      }) || null;

    // Set the current and active widgets.
    this._setWidgets(previous, null);
  }

  /**
   * Handle the DOM events for the focus tracker.
   *
   * @param event - The DOM event sent to the panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tracked nodes. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'focus':
        this._evtFocus(event as FocusEvent);
        break;
      case 'blur':
        this._evtBlur(event as FocusEvent);
        break;
    }
  }

  /**
   * Set the current and active widgets for the tracker.
   */
  private _setWidgets(current: T | null, active: T | null): void {
    // Swap the current widget.
    let oldCurrent = this._currentWidget;
    this._currentWidget = current;

    // Swap the active widget.
    let oldActive = this._activeWidget;
    this._activeWidget = active;

    // Emit the `currentChanged` signal if needed.
    if (oldCurrent !== current) {
      this._currentChanged.emit({ oldValue: oldCurrent, newValue: current });
    }

    // Emit the `activeChanged` signal if needed.
    if (oldActive !== active) {
      this._activeChanged.emit({ oldValue: oldActive, newValue: active });
    }
  }

  /**
   * Handle the `'focus'` event for a tracked widget.
   */
  private _evtFocus(event: FocusEvent): void {
    // Find the widget which gained focus, which is known to exist.
    let widget = this._nodes.get(event.currentTarget as HTMLElement)!;

    // Update the focus number if necessary.
    if (widget !== this._currentWidget) {
      this._numbers.set(widget, this._counter++);
    }

    // Set the current and active widgets.
    this._setWidgets(widget, widget);
  }

  /**
   * Handle the `'blur'` event for a tracked widget.
   */
  private _evtBlur(event: FocusEvent): void {
    // Find the widget which lost focus, which is known to exist.
    let widget = this._nodes.get(event.currentTarget as HTMLElement)!;

    // Get the node which being focused after this blur.
    let focusTarget = event.relatedTarget as HTMLElement;

    // If no other node is being focused, clear the active widget.
    if (!focusTarget) {
      this._setWidgets(this._currentWidget, null);
      return;
    }

    // Bail if the focus widget is not changing.
    if (widget.node.contains(focusTarget)) {
      return;
    }

    // If no tracked widget is being focused, clear the active widget.
    if (!find(this._widgets, w => w.node.contains(focusTarget))) {
      this._setWidgets(this._currentWidget, null);
      return;
    }
  }

  /**
   * Handle the `disposed` signal for a tracked widget.
   */
  private _onWidgetDisposed(sender: T): void {
    this.remove(sender);
  }

  private _counter = 0;
  private _widgets: T[] = [];
  private _activeWidget: T | null = null;
  private _currentWidget: T | null = null;
  private _numbers = new Map<T, number>();
  private _nodes = new Map<HTMLElement, T>();
  private _activeChanged = new Signal<this, FocusTracker.IChangedArgs<T>>(this);
  private _currentChanged = new Signal<this, FocusTracker.IChangedArgs<T>>(
    this
  );
}

/**
 * The namespace for the `FocusTracker` class statics.
 */
export namespace FocusTracker {
  /**
   * An arguments object for the changed signals.
   */
  export interface IChangedArgs<T extends Widget> {
    /**
     * The old value for the widget.
     */
    oldValue: T | null;

    /**
     * The new value for the widget.
     */
    newValue: T | null;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { ElementExt } from '@lumino/domutils';

import { Message, MessageLoop } from '@lumino/messaging';

import { AttachedProperty } from '@lumino/properties';

import { BoxEngine, BoxSizer } from './boxengine';

import { Layout, LayoutItem } from './layout';

import { Widget } from './widget';

/**
 * A layout which arranges its widgets in a grid.
 */
export class GridLayout extends Layout {
  /**
   * Construct a new grid layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: GridLayout.IOptions = {}) {
    super(options);
    if (options.rowCount !== undefined) {
      Private.reallocSizers(this._rowSizers, options.rowCount);
    }
    if (options.columnCount !== undefined) {
      Private.reallocSizers(this._columnSizers, options.columnCount);
    }
    if (options.rowSpacing !== undefined) {
      this._rowSpacing = Private.clampValue(options.rowSpacing);
    }
    if (options.columnSpacing !== undefined) {
      this._columnSpacing = Private.clampValue(options.columnSpacing);
    }
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    // Dispose of the widgets and layout items.
    for (const item of this._items) {
      let widget = item.widget;
      item.dispose();
      widget.dispose();
    }

    // Clear the layout state.
    this._box = null;
    this._items.length = 0;
    this._rowStarts.length = 0;
    this._rowSizers.length = 0;
    this._columnStarts.length = 0;
    this._columnSizers.length = 0;

    // Dispose of the rest of the layout.
    super.dispose();
  }

  /**
   * Get the number of rows in the layout.
   */
  get rowCount(): number {
    return this._rowSizers.length;
  }

  /**
   * Set the number of rows in the layout.
   *
   * #### Notes
   * The minimum row count is `1`.
   */
  set rowCount(value: number) {
    // Do nothing if the row count does not change.
    if (value === this.rowCount) {
      return;
    }

    // Reallocate the row sizers.
    Private.reallocSizers(this._rowSizers, value);

    // Schedule a fit of the parent.
    if (this.parent) {
      this.parent.fit();
    }
  }

  /**
   * Get the number of columns in the layout.
   */
  get columnCount(): number {
    return this._columnSizers.length;
  }

  /**
   * Set the number of columns in the layout.
   *
   * #### Notes
   * The minimum column count is `1`.
   */
  set columnCount(value: number) {
    // Do nothing if the column count does not change.
    if (value === this.columnCount) {
      return;
    }

    // Reallocate the column sizers.
    Private.reallocSizers(this._columnSizers, value);

    // Schedule a fit of the parent.
    if (this.parent) {
      this.parent.fit();
    }
  }

  /**
   * Get the row spacing for the layout.
   */
  get rowSpacing(): number {
    return this._rowSpacing;
  }

  /**
   * Set the row spacing for the layout.
   */
  set rowSpacing(value: number) {
    // Clamp the spacing to the allowed range.
    value = Private.clampValue(value);

    // Bail if the spacing does not change
    if (this._rowSpacing === value) {
      return;
    }

    // Update the internal spacing.
    this._rowSpacing = value;

    // Schedule a fit of the parent.
    if (this.parent) {
      this.parent.fit();
    }
  }

  /**
   * Get the column spacing for the layout.
   */
  get columnSpacing(): number {
    return this._columnSpacing;
  }

  /**
   * Set the col spacing for the layout.
   */
  set columnSpacing(value: number) {
    // Clamp the spacing to the allowed range.
    value = Private.clampValue(value);

    // Bail if the spacing does not change
    if (this._columnSpacing === value) {
      return;
    }

    // Update the internal spacing.
    this._columnSpacing = value;

    // Schedule a fit of the parent.
    if (this.parent) {
      this.parent.fit();
    }
  }

  /**
   * Get the stretch factor for a specific row.
   *
   * @param index - The row index of interest.
   *
   * @returns The stretch factor for the row.
   *
   * #### Notes
   * This returns `-1` if the index is out of range.
   */
  rowStretch(index: number): number {
    let sizer = this._rowSizers[index];
    return sizer ? sizer.stretch : -1;
  }

  /**
   * Set the stretch factor for a specific row.
   *
   * @param index - The row index of interest.
   *
   * @param value - The stretch factor for the row.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  setRowStretch(index: number, value: number): void {
    // Look up the row sizer.
    let sizer = this._rowSizers[index];

    // Bail if the index is out of range.
    if (!sizer) {
      return;
    }

    // Clamp the value to the allowed range.
    value = Private.clampValue(value);

    // Bail if the stretch does not change.
    if (sizer.stretch === value) {
      return;
    }

    // Update the sizer stretch.
    sizer.stretch = value;

    // Schedule an update of the parent.
    if (this.parent) {
      this.parent.update();
    }
  }

  /**
   * Get the stretch factor for a specific column.
   *
   * @param index - The column index of interest.
   *
   * @returns The stretch factor for the column.
   *
   * #### Notes
   * This returns `-1` if the index is out of range.
   */
  columnStretch(index: number): number {
    let sizer = this._columnSizers[index];
    return sizer ? sizer.stretch : -1;
  }

  /**
   * Set the stretch factor for a specific column.
   *
   * @param index - The column index of interest.
   *
   * @param value - The stretch factor for the column.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  setColumnStretch(index: number, value: number): void {
    // Look up the column sizer.
    let sizer = this._columnSizers[index];

    // Bail if the index is out of range.
    if (!sizer) {
      return;
    }

    // Clamp the value to the allowed range.
    value = Private.clampValue(value);

    // Bail if the stretch does not change.
    if (sizer.stretch === value) {
      return;
    }

    // Update the sizer stretch.
    sizer.stretch = value;

    // Schedule an update of the parent.
    if (this.parent) {
      this.parent.update();
    }
  }

  /**
   * Create an iterator over the widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   */
  *[Symbol.iterator](): IterableIterator<Widget> {
    for (const item of this._items) {
      yield item.widget;
    }
  }

  /**
   * Add a widget to the grid layout.
   *
   * @param widget - The widget to add to the layout.
   *
   * #### Notes
   * If the widget is already contained in the layout, this is no-op.
   */
  addWidget(widget: Widget): void {
    // Look up the index for the widget.
    let i = ArrayExt.findFirstIndex(this._items, it => it.widget === widget);

    // Bail if the widget is already in the layout.
    if (i !== -1) {
      return;
    }

    // Add the widget to the layout.
    this._items.push(new LayoutItem(widget));

    // Attach the widget to the parent.
    if (this.parent) {
      this.attachWidget(widget);
    }
  }

  /**
   * Remove a widget from the grid layout.
   *
   * @param widget - The widget to remove from the layout.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method does *not* modify the widget's `parent`.
   */
  removeWidget(widget: Widget): void {
    // Look up the index for the widget.
    let i = ArrayExt.findFirstIndex(this._items, it => it.widget === widget);

    // Bail if the widget is not in the layout.
    if (i === -1) {
      return;
    }

    // Remove the widget from the layout.
    let item = ArrayExt.removeAt(this._items, i)!;

    // Detach the widget from the parent.
    if (this.parent) {
      this.detachWidget(widget);
    }

    // Dispose the layout item.
    item.dispose();
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    super.init();
    for (const widget of this) {
      this.attachWidget(widget);
    }
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param widget - The widget to attach to the parent.
   */
  protected attachWidget(widget: Widget): void {
    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget's node to the parent.
    this.parent!.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param widget - The widget to detach from the parent.
   */
  protected detachWidget(widget: Widget): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg);
    this.parent!.update();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height);
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1);
    }
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit();
    }
  }

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Reset the min sizes of the sizers.
    for (let i = 0, n = this.rowCount; i < n; ++i) {
      this._rowSizers[i].minSize = 0;
    }
    for (let i = 0, n = this.columnCount; i < n; ++i) {
      this._columnSizers[i].minSize = 0;
    }

    // Filter for the visible layout items.
    let items = this._items.filter(it => !it.isHidden);

    // Fit the layout items.
    for (let i = 0, n = items.length; i < n; ++i) {
      items[i].fit();
    }

    // Get the max row and column index.
    let maxRow = this.rowCount - 1;
    let maxCol = this.columnCount - 1;

    // Sort the items by row span.
    items.sort(Private.rowSpanCmp);

    // Update the min sizes of the row sizers.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Fetch the item.
      let item = items[i];

      // Get the row bounds for the item.
      let config = GridLayout.getCellConfig(item.widget);
      let r1 = Math.min(config.row, maxRow);
      let r2 = Math.min(config.row + config.rowSpan - 1, maxRow);

      // Distribute the minimum height to the sizers as needed.
      Private.distributeMin(this._rowSizers, r1, r2, item.minHeight);
    }

    // Sort the items by column span.
    items.sort(Private.columnSpanCmp);

    // Update the min sizes of the column sizers.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Fetch the item.
      let item = items[i];

      // Get the column bounds for the item.
      let config = GridLayout.getCellConfig(item.widget);
      let c1 = Math.min(config.column, maxCol);
      let c2 = Math.min(config.column + config.columnSpan - 1, maxCol);

      // Distribute the minimum width to the sizers as needed.
      Private.distributeMin(this._columnSizers, c1, c2, item.minWidth);
    }

    // If no size constraint is needed, just update the parent.
    if (this.fitPolicy === 'set-no-constraint') {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
      return;
    }

    // Set up the computed min size.
    let minH = maxRow * this._rowSpacing;
    let minW = maxCol * this._columnSpacing;

    // Add the sizer minimums to the computed min size.
    for (let i = 0, n = this.rowCount; i < n; ++i) {
      minH += this._rowSizers[i].minSize;
    }
    for (let i = 0, n = this.columnCount; i < n; ++i) {
      minW += this._columnSizers[i].minSize;
    }

    // Update the box sizing and add it to the computed min size.
    let box = (this._box = ElementExt.boxSizing(this.parent!.node));
    minW += box.horizontalSum;
    minH += box.verticalSum;

    // Update the parent's min size constraints.
    let style = this.parent!.node.style;
    style.minWidth = `${minW}px`;
    style.minHeight = `${minH}px`;

    // Set the dirty flag to ensure only a single update occurs.
    this._dirty = true;

    // Notify the ancestor that it should fit immediately. This may
    // cause a resize of the parent, fulfilling the required update.
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest);
    }

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
    }
  }

  /**
   * Update the layout position and size of the widgets.
   *
   * The parent offset dimensions should be `-1` if unknown.
   */
  private _update(offsetWidth: number, offsetHeight: number): void {
    // Clear the dirty flag to indicate the update occurred.
    this._dirty = false;

    // Measure the parent if the offset dimensions are unknown.
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth;
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight;
    }

    // Ensure the parent box sizing data is computed.
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node);
    }

    // Compute the layout area adjusted for border and padding.
    let top = this._box.paddingTop;
    let left = this._box.paddingLeft;
    let width = offsetWidth - this._box.horizontalSum;
    let height = offsetHeight - this._box.verticalSum;

    // Get the max row and column index.
    let maxRow = this.rowCount - 1;
    let maxCol = this.columnCount - 1;

    // Compute the total fixed row and column space.
    let fixedRowSpace = maxRow * this._rowSpacing;
    let fixedColSpace = maxCol * this._columnSpacing;

    // Distribute the available space to the box sizers.
    BoxEngine.calc(this._rowSizers, Math.max(0, height - fixedRowSpace));
    BoxEngine.calc(this._columnSizers, Math.max(0, width - fixedColSpace));

    // Update the row start positions.
    for (let i = 0, pos = top, n = this.rowCount; i < n; ++i) {
      this._rowStarts[i] = pos;
      pos += this._rowSizers[i].size + this._rowSpacing;
    }

    // Update the column start positions.
    for (let i = 0, pos = left, n = this.columnCount; i < n; ++i) {
      this._columnStarts[i] = pos;
      pos += this._columnSizers[i].size + this._columnSpacing;
    }

    // Update the geometry of the layout items.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item.
      let item = this._items[i];

      // Ignore hidden items.
      if (item.isHidden) {
        continue;
      }

      // Fetch the cell bounds for the widget.
      let config = GridLayout.getCellConfig(item.widget);
      let r1 = Math.min(config.row, maxRow);
      let c1 = Math.min(config.column, maxCol);
      let r2 = Math.min(config.row + config.rowSpan - 1, maxRow);
      let c2 = Math.min(config.column + config.columnSpan - 1, maxCol);

      // Compute the cell geometry.
      let x = this._columnStarts[c1];
      let y = this._rowStarts[r1];
      let w = this._columnStarts[c2] + this._columnSizers[c2].size - x;
      let h = this._rowStarts[r2] + this._rowSizers[r2].size - y;

      // Update the geometry of the layout item.
      item.update(x, y, w, h);
    }
  }

  private _dirty = false;
  private _rowSpacing = 4;
  private _columnSpacing = 4;
  private _items: LayoutItem[] = [];
  private _rowStarts: number[] = [];
  private _columnStarts: number[] = [];
  private _rowSizers: BoxSizer[] = [new BoxSizer()];
  private _columnSizers: BoxSizer[] = [new BoxSizer()];
  private _box: ElementExt.IBoxSizing | null = null;
}

/**
 * The namespace for the `GridLayout` class statics.
 */
export namespace GridLayout {
  /**
   * An options object for initializing a grid layout.
   */
  export interface IOptions extends Layout.IOptions {
    /**
     * The initial row count for the layout.
     *
     * The default is `1`.
     */
    rowCount?: number;

    /**
     * The initial column count for the layout.
     *
     * The default is `1`.
     */
    columnCount?: number;

    /**
     * The spacing between rows in the layout.
     *
     * The default is `4`.
     */
    rowSpacing?: number;

    /**
     * The spacing between columns in the layout.
     *
     * The default is `4`.
     */
    columnSpacing?: number;
  }

  /**
   * An object which holds the cell configuration for a widget.
   */
  export interface ICellConfig {
    /**
     * The row index for the widget.
     */
    readonly row: number;

    /**
     * The column index for the widget.
     */
    readonly column: number;

    /**
     * The row span for the widget.
     */
    readonly rowSpan: number;

    /**
     * The column span for the widget.
     */
    readonly columnSpan: number;
  }

  /**
   * Get the cell config for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The cell config for the widget.
   */
  export function getCellConfig(widget: Widget): ICellConfig {
    return Private.cellConfigProperty.get(widget);
  }

  /**
   * Set the cell config for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the cell config.
   */
  export function setCellConfig(
    widget: Widget,
    value: Partial<ICellConfig>
  ): void {
    Private.cellConfigProperty.set(widget, Private.normalizeConfig(value));
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The property descriptor for the widget cell config.
   */
  export const cellConfigProperty = new AttachedProperty<
    Widget,
    GridLayout.ICellConfig
  >({
    name: 'cellConfig',
    create: () => ({ row: 0, column: 0, rowSpan: 1, columnSpan: 1 }),
    changed: onChildCellConfigChanged
  });

  /**
   * Normalize a partial cell config object.
   */
  export function normalizeConfig(
    config: Partial<GridLayout.ICellConfig>
  ): GridLayout.ICellConfig {
    let row = Math.max(0, Math.floor(config.row || 0));
    let column = Math.max(0, Math.floor(config.column || 0));
    let rowSpan = Math.max(1, Math.floor(config.rowSpan || 0));
    let columnSpan = Math.max(1, Math.floor(config.columnSpan || 0));
    return { row, column, rowSpan, columnSpan };
  }

  /**
   * Clamp a value to an integer >= 0.
   */
  export function clampValue(value: number): number {
    return Math.max(0, Math.floor(value));
  }

  /**
   * A sort comparison function for row spans.
   */
  export function rowSpanCmp(a: LayoutItem, b: LayoutItem): number {
    let c1 = cellConfigProperty.get(a.widget);
    let c2 = cellConfigProperty.get(b.widget);
    return c1.rowSpan - c2.rowSpan;
  }

  /**
   * A sort comparison function for column spans.
   */
  export function columnSpanCmp(a: LayoutItem, b: LayoutItem): number {
    let c1 = cellConfigProperty.get(a.widget);
    let c2 = cellConfigProperty.get(b.widget);
    return c1.columnSpan - c2.columnSpan;
  }

  /**
   * Reallocate the box sizers for the given grid dimensions.
   */
  export function reallocSizers(sizers: BoxSizer[], count: number): void {
    // Coerce the count to the valid range.
    count = Math.max(1, Math.floor(count));

    // Add the missing sizers.
    while (sizers.length < count) {
      sizers.push(new BoxSizer());
    }

    // Remove the extra sizers.
    if (sizers.length > count) {
      sizers.length = count;
    }
  }

  /**
   * Distribute a min size constraint across a range of sizers.
   */
  export function distributeMin(
    sizers: BoxSizer[],
    i1: number,
    i2: number,
    minSize: number
  ): void {
    // Sanity check the indices.
    if (i2 < i1) {
      return;
    }

    // Handle the simple case of no cell span.
    if (i1 === i2) {
      let sizer = sizers[i1];
      sizer.minSize = Math.max(sizer.minSize, minSize);
      return;
    }

    // Compute the total current min size of the span.
    let totalMin = 0;
    for (let i = i1; i <= i2; ++i) {
      totalMin += sizers[i].minSize;
    }

    // Do nothing if the total is greater than the required.
    if (totalMin >= minSize) {
      return;
    }

    // Compute the portion of the space to allocate to each sizer.
    let portion = (minSize - totalMin) / (i2 - i1 + 1);

    // Add the portion to each sizer.
    for (let i = i1; i <= i2; ++i) {
      sizers[i].minSize += portion;
    }
  }

  /**
   * The change handler for the child cell config property.
   */
  function onChildCellConfigChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof GridLayout) {
      child.parent.fit();
    }
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
export * from './accordionlayout';
export * from './accordionpanel';
export * from './boxengine';
export * from './boxlayout';
export * from './boxpanel';
export * from './commandpalette';
export * from './contextmenu';
export * from './docklayout';
export * from './dockpanel';
export * from './focustracker';
export * from './gridlayout';
export * from './layout';
export * from './menu';
export * from './menubar';
export * from './panel';
export * from './panellayout';
export * from './scrollbar';
export * from './singletonlayout';
export * from './splitlayout';
export * from './splitpanel';
export * from './stackedlayout';
export * from './stackedpanel';
export * from './tabbar';
export * from './tabpanel';
export * from './title';
export * from './widget';
/* eslint-disable @typescript-eslint/no-empty-function */
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { IDisposable } from '@lumino/disposable';

import { ElementExt } from '@lumino/domutils';

import { Message, MessageLoop } from '@lumino/messaging';

import { AttachedProperty } from '@lumino/properties';

import { Signal } from '@lumino/signaling';

import { Widget } from './widget';

/**
 * An abstract base class for creating lumino layouts.
 *
 * #### Notes
 * A layout is used to add widgets to a parent and to arrange those
 * widgets within the parent's DOM node.
 *
 * This class implements the base functionality which is required of
 * nearly all layouts. It must be subclassed in order to be useful.
 *
 * Notably, this class does not define a uniform interface for adding
 * widgets to the layout. A subclass should define that API in a way
 * which is meaningful for its intended use.
 */
export abstract class Layout implements Iterable<Widget>, IDisposable {
  /**
   * Construct a new layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: Layout.IOptions = {}) {
    this._fitPolicy = options.fitPolicy || 'set-min-size';
  }

  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This should be reimplemented to clear and dispose of the widgets.
   *
   * All reimplementations should call the superclass method.
   *
   * This method is called automatically when the parent is disposed.
   */
  dispose(): void {
    this._parent = null;
    this._disposed = true;
    Signal.clearData(this);
    AttachedProperty.clearData(this);
  }

  /**
   * Test whether the layout is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Get the parent widget of the layout.
   */
  get parent(): Widget | null {
    return this._parent;
  }

  /**
   * Set the parent widget of the layout.
   *
   * #### Notes
   * This is set automatically when installing the layout on the parent
   * widget. The parent widget should not be set directly by user code.
   */
  set parent(value: Widget | null) {
    if (this._parent === value) {
      return;
    }
    if (this._parent) {
      throw new Error('Cannot change parent widget.');
    }
    if (value!.layout !== this) {
      throw new Error('Invalid parent widget.');
    }
    this._parent = value;
    this.init();
  }

  /**
   * Get the fit policy for the layout.
   *
   * #### Notes
   * The fit policy controls the computed size constraints which are
   * applied to the parent widget by the layout.
   *
   * Some layout implementations may ignore the fit policy.
   */
  get fitPolicy(): Layout.FitPolicy {
    return this._fitPolicy;
  }

  /**
   * Set the fit policy for the layout.
   *
   * #### Notes
   * The fit policy controls the computed size constraints which are
   * applied to the parent widget by the layout.
   *
   * Some layout implementations may ignore the fit policy.
   *
   * Changing the fit policy will clear the current size constraint
   * for the parent widget and then re-fit the parent.
   */
  set fitPolicy(value: Layout.FitPolicy) {
    // Bail if the policy does not change
    if (this._fitPolicy === value) {
      return;
    }

    // Update the internal policy.
    this._fitPolicy = value;

    // Clear the size constraints and schedule a fit of the parent.
    if (this._parent) {
      let style = this._parent.node.style;
      style.minWidth = '';
      style.minHeight = '';
      style.maxWidth = '';
      style.maxHeight = '';
      this._parent.fit();
    }
  }

  /**
   * Create an iterator over the widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   *
   * #### Notes
   * This abstract method must be implemented by a subclass.
   */
  abstract [Symbol.iterator](): IterableIterator<Widget>;

  /**
   * Remove a widget from the layout.
   *
   * @param widget - The widget to remove from the layout.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method should *not* modify the widget's `parent`.
   */
  abstract removeWidget(widget: Widget): void;

  /**
   * Process a message sent to the parent widget.
   *
   * @param msg - The message sent to the parent widget.
   *
   * #### Notes
   * This method is called by the parent widget to process a message.
   *
   * Subclasses may reimplement this method as needed.
   */
  processParentMessage(msg: Message): void {
    switch (msg.type) {
      case 'resize':
        this.onResize(msg as Widget.ResizeMessage);
        break;
      case 'update-request':
        this.onUpdateRequest(msg);
        break;
      case 'fit-request':
        this.onFitRequest(msg);
        break;
      case 'before-show':
        this.onBeforeShow(msg);
        break;
      case 'after-show':
        this.onAfterShow(msg);
        break;
      case 'before-hide':
        this.onBeforeHide(msg);
        break;
      case 'after-hide':
        this.onAfterHide(msg);
        break;
      case 'before-attach':
        this.onBeforeAttach(msg);
        break;
      case 'after-attach':
        this.onAfterAttach(msg);
        break;
      case 'before-detach':
        this.onBeforeDetach(msg);
        break;
      case 'after-detach':
        this.onAfterDetach(msg);
        break;
      case 'child-removed':
        this.onChildRemoved(msg as Widget.ChildMessage);
        break;
      case 'child-shown':
        this.onChildShown(msg as Widget.ChildMessage);
        break;
      case 'child-hidden':
        this.onChildHidden(msg as Widget.ChildMessage);
        break;
    }
  }

  /**
   * Perform layout initialization which requires the parent widget.
   *
   * #### Notes
   * This method is invoked immediately after the layout is installed
   * on the parent widget.
   *
   * The default implementation reparents all of the widgets to the
   * layout parent widget.
   *
   * Subclasses should reimplement this method and attach the child
   * widget nodes to the parent widget's node.
   */
  protected init(): void {
    for (const widget of this) {
      widget.parent = this.parent;
    }
  }

  /**
   * A message handler invoked on a `'resize'` message.
   *
   * #### Notes
   * The layout should ensure that its widgets are resized according
   * to the specified layout space, and that they are sent a `'resize'`
   * message if appropriate.
   *
   * The default implementation of this method sends an `UnknownSize`
   * resize message to all widgets.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   *
   * #### Notes
   * The layout should ensure that its widgets are resized according
   * to the available layout space, and that they are sent a `'resize'`
   * message if appropriate.
   *
   * The default implementation of this method sends an `UnknownSize`
   * resize message to all widgets.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onUpdateRequest(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all widgets. It assumes all widget nodes are attached to the
   * parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeAttach(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, msg);
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all widgets. It assumes all widget nodes are attached to the
   * parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterAttach(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, msg);
    }
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all widgets. It assumes all widget nodes are attached to the
   * parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeDetach(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, msg);
    }
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all widgets. It assumes all widget nodes are attached to the
   * parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterDetach(msg: Message): void {
    for (const widget of this) {
      MessageLoop.sendMessage(widget, msg);
    }
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message to
   * all non-hidden widgets. It assumes all widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeShow(msg: Message): void {
    for (const widget of this) {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg);
      }
    }
  }

  /**
   * A message handler invoked on an `'after-show'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message to
   * all non-hidden widgets. It assumes all widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterShow(msg: Message): void {
    for (const widget of this) {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg);
      }
    }
  }

  /**
   * A message handler invoked on a `'before-hide'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message to
   * all non-hidden widgets. It assumes all widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeHide(msg: Message): void {
    for (const widget of this) {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg);
      }
    }
  }

  /**
   * A message handler invoked on an `'after-hide'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message to
   * all non-hidden widgets. It assumes all widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterHide(msg: Message): void {
    for (const widget of this) {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg);
      }
    }
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   *
   * #### Notes
   * This will remove the child widget from the layout.
   *
   * Subclasses should **not** typically reimplement this method.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    this.removeWidget(msg.child);
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onFitRequest(msg: Message): void {}

  /**
   * A message handler invoked on a `'child-shown'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildShown(msg: Widget.ChildMessage): void {}

  /**
   * A message handler invoked on a `'child-hidden'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void {}

  private _disposed = false;
  private _fitPolicy: Layout.FitPolicy;
  private _parent: Widget | null = null;
}

/**
 * The namespace for the `Layout` class statics.
 */
export namespace Layout {
  /**
   * A type alias for the layout fit policy.
   *
   * #### Notes
   * The fit policy controls the computed size constraints which are
   * applied to the parent widget by the layout.
   *
   * Some layout implementations may ignore the fit policy.
   */
  export type FitPolicy =
    | /**
     * No size constraint will be applied to the parent widget.
     */
    'set-no-constraint'

    /**
     * The computed min size will be applied to the parent widget.
     */
    | 'set-min-size';

  /**
   * An options object for initializing a layout.
   */
  export interface IOptions {
    /**
     * The fit policy for the layout.
     *
     * The default is `'set-min-size'`.
     */
    fitPolicy?: FitPolicy;
  }

  /**
   * A type alias for the horizontal alignment of a widget.
   */
  export type HorizontalAlignment = 'left' | 'center' | 'right';

  /**
   * A type alias for the vertical alignment of a widget.
   */
  export type VerticalAlignment = 'top' | 'center' | 'bottom';

  /**
   * Get the horizontal alignment for a widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The horizontal alignment for the widget.
   *
   * #### Notes
   * If the layout width allocated to a widget is larger than its max
   * width, the horizontal alignment controls how the widget is placed
   * within the extra horizontal space.
   *
   * If the allocated width is less than the widget's max width, the
   * horizontal alignment has no effect.
   *
   * Some layout implementations may ignore horizontal alignment.
   */
  export function getHorizontalAlignment(widget: Widget): HorizontalAlignment {
    return Private.horizontalAlignmentProperty.get(widget);
  }

  /**
   * Set the horizontal alignment for a widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the horizontal alignment.
   *
   * #### Notes
   * If the layout width allocated to a widget is larger than its max
   * width, the horizontal alignment controls how the widget is placed
   * within the extra horizontal space.
   *
   * If the allocated width is less than the widget's max width, the
   * horizontal alignment has no effect.
   *
   * Some layout implementations may ignore horizontal alignment.
   *
   * Changing the horizontal alignment will post an `update-request`
   * message to widget's parent, provided the parent has a layout
   * installed.
   */
  export function setHorizontalAlignment(
    widget: Widget,
    value: HorizontalAlignment
  ): void {
    Private.horizontalAlignmentProperty.set(widget, value);
  }

  /**
   * Get the vertical alignment for a widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The vertical alignment for the widget.
   *
   * #### Notes
   * If the layout height allocated to a widget is larger than its max
   * height, the vertical alignment controls how the widget is placed
   * within the extra vertical space.
   *
   * If the allocated height is less than the widget's max height, the
   * vertical alignment has no effect.
   *
   * Some layout implementations may ignore vertical alignment.
   */
  export function getVerticalAlignment(widget: Widget): VerticalAlignment {
    return Private.verticalAlignmentProperty.get(widget);
  }

  /**
   * Set the vertical alignment for a widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the vertical alignment.
   *
   * #### Notes
   * If the layout height allocated to a widget is larger than its max
   * height, the vertical alignment controls how the widget is placed
   * within the extra vertical space.
   *
   * If the allocated height is less than the widget's max height, the
   * vertical alignment has no effect.
   *
   * Some layout implementations may ignore vertical alignment.
   *
   * Changing the horizontal alignment will post an `update-request`
   * message to widget's parent, provided the parent has a layout
   * installed.
   */
  export function setVerticalAlignment(
    widget: Widget,
    value: VerticalAlignment
  ): void {
    Private.verticalAlignmentProperty.set(widget, value);
  }
}

/**
 * An object which assists in the absolute layout of widgets.
 *
 * #### Notes
 * This class is useful when implementing a layout which arranges its
 * widgets using absolute positioning.
 *
 * This class is used by nearly all of the built-in lumino layouts.
 */
export class LayoutItem implements IDisposable {
  /**
   * Construct a new layout item.
   *
   * @param widget - The widget to be managed by the item.
   *
   * #### Notes
   * The widget will be set to absolute positioning.
   */
  constructor(widget: Widget) {
    this.widget = widget;
    this.widget.node.style.position = 'absolute';
  }

  /**
   * Dispose of the the layout item.
   *
   * #### Notes
   * This will reset the positioning of the widget.
   */
  dispose(): void {
    // Do nothing if the item is already disposed.
    if (this._disposed) {
      return;
    }

    // Mark the item as disposed.
    this._disposed = true;

    // Reset the widget style.
    let style = this.widget.node.style;
    style.position = '';
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
  }

  /**
   * The widget managed by the layout item.
   */
  readonly widget: Widget;

  /**
   * The computed minimum width of the widget.
   *
   * #### Notes
   * This value can be updated by calling the `fit` method.
   */
  get minWidth(): number {
    return this._minWidth;
  }

  /**
   * The computed minimum height of the widget.
   *
   * #### Notes
   * This value can be updated by calling the `fit` method.
   */
  get minHeight(): number {
    return this._minHeight;
  }

  /**
   * The computed maximum width of the widget.
   *
   * #### Notes
   * This value can be updated by calling the `fit` method.
   */
  get maxWidth(): number {
    return this._maxWidth;
  }

  /**
   * The computed maximum height of the widget.
   *
   * #### Notes
   * This value can be updated by calling the `fit` method.
   */
  get maxHeight(): number {
    return this._maxHeight;
  }

  /**
   * Whether the layout item is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Whether the managed widget is hidden.
   */
  get isHidden(): boolean {
    return this.widget.isHidden;
  }

  /**
   * Whether the managed widget is visible.
   */
  get isVisible(): boolean {
    return this.widget.isVisible;
  }

  /**
   * Whether the managed widget is attached.
   */
  get isAttached(): boolean {
    return this.widget.isAttached;
  }

  /**
   * Update the computed size limits of the managed widget.
   */
  fit(): void {
    let limits = ElementExt.sizeLimits(this.widget.node);
    this._minWidth = limits.minWidth;
    this._minHeight = limits.minHeight;
    this._maxWidth = limits.maxWidth;
    this._maxHeight = limits.maxHeight;
  }

  /**
   * Update the position and size of the managed widget.
   *
   * @param left - The left edge position of the layout box.
   *
   * @param top - The top edge position of the layout box.
   *
   * @param width - The width of the layout box.
   *
   * @param height - The height of the layout box.
   */
  update(left: number, top: number, width: number, height: number): void {
    // Clamp the size to the computed size limits.
    let clampW = Math.max(this._minWidth, Math.min(width, this._maxWidth));
    let clampH = Math.max(this._minHeight, Math.min(height, this._maxHeight));

    // Adjust the left edge for the horizontal alignment, if needed.
    if (clampW < width) {
      switch (Layout.getHorizontalAlignment(this.widget)) {
        case 'left':
          break;
        case 'center':
          left += (width - clampW) / 2;
          break;
        case 'right':
          left += width - clampW;
          break;
        default:
          throw 'unreachable';
      }
    }

    // Adjust the top edge for the vertical alignment, if needed.
    if (clampH < height) {
      switch (Layout.getVerticalAlignment(this.widget)) {
        case 'top':
          break;
        case 'center':
          top += (height - clampH) / 2;
          break;
        case 'bottom':
          top += height - clampH;
          break;
        default:
          throw 'unreachable';
      }
    }

    // Set up the resize variables.
    let resized = false;
    let style = this.widget.node.style;

    // Update the top edge of the widget if needed.
    if (this._top !== top) {
      this._top = top;
      style.top = `${top}px`;
    }

    // Update the left edge of the widget if needed.
    if (this._left !== left) {
      this._left = left;
      style.left = `${left}px`;
    }

    // Update the width of the widget if needed.
    if (this._width !== clampW) {
      resized = true;
      this._width = clampW;
      style.width = `${clampW}px`;
    }

    // Update the height of the widget if needed.
    if (this._height !== clampH) {
      resized = true;
      this._height = clampH;
      style.height = `${clampH}px`;
    }

    // Send a resize message to the widget if needed.
    if (resized) {
      let msg = new Widget.ResizeMessage(clampW, clampH);
      MessageLoop.sendMessage(this.widget, msg);
    }
  }

  private _top = NaN;
  private _left = NaN;
  private _width = NaN;
  private _height = NaN;
  private _minWidth = 0;
  private _minHeight = 0;
  private _maxWidth = Infinity;
  private _maxHeight = Infinity;
  private _disposed = false;
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The attached property for a widget horizontal alignment.
   */
  export const horizontalAlignmentProperty = new AttachedProperty<
    Widget,
    Layout.HorizontalAlignment
  >({
    name: 'horizontalAlignment',
    create: () => 'center',
    changed: onAlignmentChanged
  });

  /**
   * The attached property for a widget vertical alignment.
   */
  export const verticalAlignmentProperty = new AttachedProperty<
    Widget,
    Layout.VerticalAlignment
  >({
    name: 'verticalAlignment',
    create: () => 'top',
    changed: onAlignmentChanged
  });

  /**
   * The change handler for the attached alignment properties.
   */
  function onAlignmentChanged(child: Widget): void {
    if (child.parent && child.parent.layout) {
      child.parent.update();
    }
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { CommandRegistry } from '@lumino/commands';

import { JSONExt, ReadonlyJSONObject } from '@lumino/coreutils';

import { ElementExt } from '@lumino/domutils';

import { getKeyboardLayout } from '@lumino/keyboard';

import { Message, MessageLoop } from '@lumino/messaging';

import { ISignal, Signal } from '@lumino/signaling';

import {
  ARIAAttrNames,
  ElementARIAAttrs,
  ElementDataset,
  h,
  VirtualDOM,
  VirtualElement
} from '@lumino/virtualdom';

import { Widget } from './widget';

/**
 * A widget which displays items as a canonical menu.
 */
export class Menu extends Widget {
  /**
   * Construct a new menu.
   *
   * @param options - The options for initializing the menu.
   */
  constructor(options: Menu.IOptions) {
    super({ node: Private.createNode() });
    this.addClass('lm-Menu');
    this.setFlag(Widget.Flag.DisallowLayout);
    this.commands = options.commands;
    this.renderer = options.renderer || Menu.defaultRenderer;
  }

  /**
   * Dispose of the resources held by the menu.
   */
  dispose(): void {
    this.close();
    this._items.length = 0;
    super.dispose();
  }

  /**
   * A signal emitted just before the menu is closed.
   *
   * #### Notes
   * This signal is emitted when the menu receives a `'close-request'`
   * message, just before it removes itself from the DOM.
   *
   * This signal is not emitted if the menu is already detached from
   * the DOM when it receives the `'close-request'` message.
   */
  get aboutToClose(): ISignal<this, void> {
    return this._aboutToClose;
  }

  /**
   * A signal emitted when a new menu is requested by the user.
   *
   * #### Notes
   * This signal is emitted whenever the user presses the right or left
   * arrow keys, and a submenu cannot be opened or closed in response.
   *
   * This signal is useful when implementing menu bars in order to open
   * the next or previous menu in response to a user key press.
   *
   * This signal is only emitted for the root menu in a hierarchy.
   */
  get menuRequested(): ISignal<this, 'next' | 'previous'> {
    return this._menuRequested;
  }

  /**
   * The command registry used by the menu.
   */
  readonly commands: CommandRegistry;

  /**
   * The renderer used by the menu.
   */
  readonly renderer: Menu.IRenderer;

  /**
   * The parent menu of the menu.
   *
   * #### Notes
   * This is `null` unless the menu is an open submenu.
   */
  get parentMenu(): Menu | null {
    return this._parentMenu;
  }

  /**
   * The child menu of the menu.
   *
   * #### Notes
   * This is `null` unless the menu has an open submenu.
   */
  get childMenu(): Menu | null {
    return this._childMenu;
  }

  /**
   * The root menu of the menu hierarchy.
   */
  get rootMenu(): Menu {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let menu: Menu = this;
    while (menu._parentMenu) {
      menu = menu._parentMenu;
    }
    return menu;
  }

  /**
   * The leaf menu of the menu hierarchy.
   */
  get leafMenu(): Menu {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let menu: Menu = this;
    while (menu._childMenu) {
      menu = menu._childMenu;
    }
    return menu;
  }

  /**
   * The menu content node.
   *
   * #### Notes
   * This is the node which holds the menu item nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(
      'lm-Menu-content'
    )[0] as HTMLUListElement;
  }

  /**
   * Get the currently active menu item.
   */
  get activeItem(): Menu.IItem | null {
    return this._items[this._activeIndex] || null;
  }

  /**
   * Set the currently active menu item.
   *
   * #### Notes
   * If the item cannot be activated, the item will be set to `null`.
   */
  set activeItem(value: Menu.IItem | null) {
    this.activeIndex = value ? this._items.indexOf(value) : -1;
  }

  /**
   * Get the index of the currently active menu item.
   *
   * #### Notes
   * This will be `-1` if no menu item is active.
   */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * Set the index of the currently active menu item.
   *
   * #### Notes
   * If the item cannot be activated, the index will be set to `-1`.
   */
  set activeIndex(value: number) {
    // Adjust the value for an out of range index.
    if (value < 0 || value >= this._items.length) {
      value = -1;
    }

    // Ensure the item can be activated.
    if (value !== -1 && !Private.canActivate(this._items[value])) {
      value = -1;
    }

    // Bail if the index will not change.
    if (this._activeIndex === value) {
      return;
    }

    // Update the active index.
    this._activeIndex = value;

    // Make active element in focus
    if (
      this._activeIndex >= 0 &&
      this.contentNode.childNodes[this._activeIndex]
    ) {
      (this.contentNode.childNodes[this._activeIndex] as HTMLElement).focus();
    }

    // schedule an update of the items.
    this.update();
  }

  /**
   * A read-only array of the menu items in the menu.
   */
  get items(): ReadonlyArray<Menu.IItem> {
    return this._items;
  }

  /**
   * Activate the next selectable item in the menu.
   *
   * #### Notes
   * If no item is selectable, the index will be set to `-1`.
   */
  activateNextItem(): void {
    let n = this._items.length;
    let ai = this._activeIndex;
    let start = ai < n - 1 ? ai + 1 : 0;
    let stop = start === 0 ? n - 1 : start - 1;
    this.activeIndex = ArrayExt.findFirstIndex(
      this._items,
      Private.canActivate,
      start,
      stop
    );
  }

  /**
   * Activate the previous selectable item in the menu.
   *
   * #### Notes
   * If no item is selectable, the index will be set to `-1`.
   */
  activatePreviousItem(): void {
    let n = this._items.length;
    let ai = this._activeIndex;
    let start = ai <= 0 ? n - 1 : ai - 1;
    let stop = start === n - 1 ? 0 : start + 1;
    this.activeIndex = ArrayExt.findLastIndex(
      this._items,
      Private.canActivate,
      start,
      stop
    );
  }

  /**
   * Trigger the active menu item.
   *
   * #### Notes
   * If the active item is a submenu, it will be opened and the first
   * item will be activated.
   *
   * If the active item is a command, the command will be executed.
   *
   * If the menu is not attached, this is a no-op.
   *
   * If there is no active item, this is a no-op.
   */
  triggerActiveItem(): void {
    // Bail if the menu is not attached.
    if (!this.isAttached) {
      return;
    }

    // Bail if there is no active item.
    let item = this.activeItem;
    if (!item) {
      return;
    }

    // Cancel the pending timers.
    this._cancelOpenTimer();
    this._cancelCloseTimer();

    // If the item is a submenu, open it.
    if (item.type === 'submenu') {
      this._openChildMenu(true);
      return;
    }

    // Close the root menu before executing the command.
    this.rootMenu.close();

    // Execute the command for the item.
    let { command, args } = item;
    if (this.commands.isEnabled(command, args)) {
      this.commands.execute(command, args);
    } else {
      console.log(`Command '${command}' is disabled.`);
    }
  }

  /**
   * Add a menu item to the end of the menu.
   *
   * @param options - The options for creating the menu item.
   *
   * @returns The menu item added to the menu.
   */
  addItem(options: Menu.IItemOptions): Menu.IItem {
    return this.insertItem(this._items.length, options);
  }

  /**
   * Insert a menu item into the menu at the specified index.
   *
   * @param index - The index at which to insert the item.
   *
   * @param options - The options for creating the menu item.
   *
   * @returns The menu item added to the menu.
   *
   * #### Notes
   * The index will be clamped to the bounds of the items.
   */
  insertItem(index: number, options: Menu.IItemOptions): Menu.IItem {
    // Close the menu if it's attached.
    if (this.isAttached) {
      this.close();
    }

    // Reset the active index.
    this.activeIndex = -1;

    // Clamp the insert index to the array bounds.
    let i = Math.max(0, Math.min(index, this._items.length));

    // Create the item for the options.
    let item = Private.createItem(this, options);

    // Insert the item into the array.
    ArrayExt.insert(this._items, i, item);

    // Schedule an update of the items.
    this.update();

    // Return the item added to the menu.
    return item;
  }

  /**
   * Remove an item from the menu.
   *
   * @param item - The item to remove from the menu.
   *
   * #### Notes
   * This is a no-op if the item is not in the menu.
   */
  removeItem(item: Menu.IItem): void {
    this.removeItemAt(this._items.indexOf(item));
  }

  /**
   * Remove the item at a given index from the menu.
   *
   * @param index - The index of the item to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeItemAt(index: number): void {
    // Close the menu if it's attached.
    if (this.isAttached) {
      this.close();
    }

    // Reset the active index.
    this.activeIndex = -1;

    // Remove the item from the array.
    let item = ArrayExt.removeAt(this._items, index);

    // Bail if the index is out of range.
    if (!item) {
      return;
    }

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Remove all menu items from the menu.
   */
  clearItems(): void {
    // Close the menu if it's attached.
    if (this.isAttached) {
      this.close();
    }

    // Reset the active index.
    this.activeIndex = -1;

    // Bail if there is nothing to remove.
    if (this._items.length === 0) {
      return;
    }

    // Clear the items.
    this._items.length = 0;

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Open the menu at the specified location.
   *
   * @param x - The client X coordinate of the menu location.
   *
   * @param y - The client Y coordinate of the menu location.
   *
   * @param options - The additional options for opening the menu.
   *
   * #### Notes
   * The menu will be opened at the given location unless it will not
   * fully fit on the screen. If it will not fit, it will be adjusted
   * to fit naturally on the screen.
   *
   * This is a no-op if the menu is already attached to the DOM.
   */
  open(x: number, y: number, options: Menu.IOpenOptions = {}): void {
    // Bail early if the menu is already attached.
    if (this.isAttached) {
      return;
    }

    // Extract the position options.
    let forceX = options.forceX || false;
    let forceY = options.forceY || false;

    // Open the menu as a root menu.
    Private.openRootMenu(this, x, y, forceX, forceY);

    // Activate the menu to accept keyboard input.
    this.activate();
  }

  /**
   * Handle the DOM events for the menu.
   *
   * @param event - The DOM event sent to the menu.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the menu's DOM nodes. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
      case 'mouseup':
        this._evtMouseUp(event as MouseEvent);
        break;
      case 'mousemove':
        this._evtMouseMove(event as MouseEvent);
        break;
      case 'mouseenter':
        this._evtMouseEnter(event as MouseEvent);
        break;
      case 'mouseleave':
        this._evtMouseLeave(event as MouseEvent);
        break;
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
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('keydown', this);
    this.node.addEventListener('mouseup', this);
    this.node.addEventListener('mousemove', this);
    this.node.addEventListener('mouseenter', this);
    this.node.addEventListener('mouseleave', this);
    this.node.addEventListener('contextmenu', this);
    document.addEventListener('mousedown', this, true);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('keydown', this);
    this.node.removeEventListener('mouseup', this);
    this.node.removeEventListener('mousemove', this);
    this.node.removeEventListener('mouseenter', this);
    this.node.removeEventListener('mouseleave', this);
    this.node.removeEventListener('contextmenu', this);
    document.removeEventListener('mousedown', this, true);
  }

  /**
   * A message handler invoked on an `'activate-request'` message.
   */
  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      this.node.focus();
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    let items = this._items;
    let renderer = this.renderer;
    let activeIndex = this._activeIndex;
    let collapsedFlags = Private.computeCollapsed(items);
    let content = new Array<VirtualElement>(items.length);
    for (let i = 0, n = items.length; i < n; ++i) {
      let item = items[i];
      let active = i === activeIndex;
      let collapsed = collapsedFlags[i];
      content[i] = renderer.renderItem({
        item,
        active,
        collapsed,
        onfocus: () => {
          this.activeIndex = i;
        }
      });
    }
    VirtualDOM.render(content, this.contentNode);
  }

  /**
   * A message handler invoked on a `'close-request'` message.
   */
  protected onCloseRequest(msg: Message): void {
    // Cancel the pending timers.
    this._cancelOpenTimer();
    this._cancelCloseTimer();

    // Reset the active index.
    this.activeIndex = -1;

    // Close any open child menu.
    let childMenu = this._childMenu;
    if (childMenu) {
      this._childIndex = -1;
      this._childMenu = null;
      childMenu._parentMenu = null;
      childMenu.close();
    }

    // Remove this menu from its parent and activate the parent.
    let parentMenu = this._parentMenu;
    if (parentMenu) {
      this._parentMenu = null;
      parentMenu._childIndex = -1;
      parentMenu._childMenu = null;
      parentMenu.activate();
    }

    // Emit the `aboutToClose` signal if the menu is attached.
    if (this.isAttached) {
      this._aboutToClose.emit(undefined);
    }

    // Finish closing the menu.
    super.onCloseRequest(msg);
  }

  /**
   * Handle the `'keydown'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // A menu handles all keydown events.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the key code for the event.
    let kc = event.keyCode;

    // Enter
    if (kc === 13) {
      this.triggerActiveItem();
      return;
    }

    // Escape
    if (kc === 27) {
      this.close();
      return;
    }

    // Left Arrow
    if (kc === 37) {
      if (this._parentMenu) {
        this.close();
      } else {
        this._menuRequested.emit('previous');
      }
      return;
    }

    // Up Arrow
    if (kc === 38) {
      this.activatePreviousItem();
      return;
    }

    // Right Arrow
    if (kc === 39) {
      let item = this.activeItem;
      if (item && item.type === 'submenu') {
        this.triggerActiveItem();
      } else {
        this.rootMenu._menuRequested.emit('next');
      }
      return;
    }

    // Down Arrow
    if (kc === 40) {
      this.activateNextItem();
      return;
    }

    // Get the pressed key character.
    let key = getKeyboardLayout().keyForKeydownEvent(event);

    // Bail if the key is not valid.
    if (!key) {
      return;
    }

    // Search for the next best matching mnemonic item.
    let start = this._activeIndex + 1;
    let result = Private.findMnemonic(this._items, key, start);

    // Handle the requested mnemonic based on the search results.
    // If exactly one mnemonic is matched, that item is triggered.
    // Otherwise, the next mnemonic is activated if available,
    // followed by the auto mnemonic if available.
    if (result.index !== -1 && !result.multiple) {
      this.activeIndex = result.index;
      this.triggerActiveItem();
    } else if (result.index !== -1) {
      this.activeIndex = result.index;
    } else if (result.auto !== -1) {
      this.activeIndex = result.auto;
    }
  }

  /**
   * Handle the `'mouseup'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.triggerActiveItem();
  }

  /**
   * Handle the `'mousemove'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Hit test the item nodes for the item under the mouse.
    let index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return ElementExt.hitTest(node, event.clientX, event.clientY);
    });

    // Bail early if the mouse is already over the active index.
    if (index === this._activeIndex) {
      return;
    }

    // Update and coerce the active index.
    this.activeIndex = index;
    index = this.activeIndex;

    // If the index is the current child index, cancel the timers.
    if (index === this._childIndex) {
      this._cancelOpenTimer();
      this._cancelCloseTimer();
      return;
    }

    // If a child menu is currently open, start the close timer.
    if (this._childIndex !== -1) {
      this._startCloseTimer();
    }

    // Cancel the open timer to give a full delay for opening.
    this._cancelOpenTimer();

    // Bail if the active item is not a valid submenu item.
    let item = this.activeItem;
    if (!item || item.type !== 'submenu' || !item.submenu) {
      return;
    }

    // Start the open timer to open the active item submenu.
    this._startOpenTimer();
  }

  /**
   * Handle the `'mouseenter'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseEnter(event: MouseEvent): void {
    // Synchronize the active ancestor items.
    for (let menu = this._parentMenu; menu; menu = menu._parentMenu) {
      menu._cancelOpenTimer();
      menu._cancelCloseTimer();
      menu.activeIndex = menu._childIndex;
    }
  }

  /**
   * Handle the `'mouseleave'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    // Cancel any pending submenu opening.
    this._cancelOpenTimer();

    // If there is no open child menu, just reset the active index.
    if (!this._childMenu) {
      this.activeIndex = -1;
      return;
    }

    // If the mouse is over the child menu, cancel the close timer.
    let { clientX, clientY } = event;
    if (ElementExt.hitTest(this._childMenu.node, clientX, clientY)) {
      this._cancelCloseTimer();
      return;
    }

    // Otherwise, reset the active index and start the close timer.
    this.activeIndex = -1;
    this._startCloseTimer();
  }

  /**
   * Handle the `'mousedown'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Bail if the menu is not a root menu.
    if (this._parentMenu) {
      return;
    }

    // The mouse button which is pressed is irrelevant. If the press
    // is not on a menu, the entire hierarchy is closed and the event
    // is allowed to propagate. This allows other code to act on the
    // event, such as focusing the clicked element.
    if (Private.hitTestMenus(this, event.clientX, event.clientY)) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.close();
    }
  }

  /**
   * Open the child menu at the active index immediately.
   *
   * If a different child menu is already open, it will be closed,
   * even if the active item is not a valid submenu.
   */
  private _openChildMenu(activateFirst = false): void {
    // If the item is not a valid submenu, close the child menu.
    let item = this.activeItem;
    if (!item || item.type !== 'submenu' || !item.submenu) {
      this._closeChildMenu();
      return;
    }

    // Do nothing if the child menu will not change.
    let submenu = item.submenu;
    if (submenu === this._childMenu) {
      return;
    }

    // Ensure the current child menu is closed.
    this._closeChildMenu();

    // Update the private child state.
    this._childMenu = submenu;
    this._childIndex = this._activeIndex;

    // Set the parent menu reference for the child.
    submenu._parentMenu = this;

    // Ensure the menu is updated and lookup the item node.
    MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);
    let itemNode = this.contentNode.children[this._activeIndex];

    // Open the submenu at the active node.
    Private.openSubmenu(submenu, itemNode as HTMLElement);

    // Activate the first item if desired.
    if (activateFirst) {
      submenu.activeIndex = -1;
      submenu.activateNextItem();
    }

    // Activate the child menu.
    submenu.activate();
  }

  /**
   * Close the child menu immediately.
   *
   * This is a no-op if a child menu is not open.
   */
  private _closeChildMenu(): void {
    if (this._childMenu) {
      this._childMenu.close();
    }
  }

  /**
   * Start the open timer, unless it is already pending.
   */
  private _startOpenTimer(): void {
    if (this._openTimerID === 0) {
      this._openTimerID = window.setTimeout(() => {
        this._openTimerID = 0;
        this._openChildMenu();
      }, Private.TIMER_DELAY);
    }
  }

  /**
   * Start the close timer, unless it is already pending.
   */
  private _startCloseTimer(): void {
    if (this._closeTimerID === 0) {
      this._closeTimerID = window.setTimeout(() => {
        this._closeTimerID = 0;
        this._closeChildMenu();
      }, Private.TIMER_DELAY);
    }
  }

  /**
   * Cancel the open timer, if the timer is pending.
   */
  private _cancelOpenTimer(): void {
    if (this._openTimerID !== 0) {
      clearTimeout(this._openTimerID);
      this._openTimerID = 0;
    }
  }

  /**
   * Cancel the close timer, if the timer is pending.
   */
  private _cancelCloseTimer(): void {
    if (this._closeTimerID !== 0) {
      clearTimeout(this._closeTimerID);
      this._closeTimerID = 0;
    }
  }

  private _childIndex = -1;
  private _activeIndex = -1;
  private _openTimerID = 0;
  private _closeTimerID = 0;
  private _items: Menu.IItem[] = [];
  private _childMenu: Menu | null = null;
  private _parentMenu: Menu | null = null;
  private _aboutToClose = new Signal<this, void>(this);
  private _menuRequested = new Signal<this, 'next' | 'previous'>(this);
}

/**
 * The namespace for the `Menu` class statics.
 */
export namespace Menu {
  /**
   * An options object for creating a menu.
   */
  export interface IOptions {
    /**
     * The command registry for use with the menu.
     */
    commands: CommandRegistry;

    /**
     * A custom renderer for use with the menu.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
  }

  /**
   * An options object for the `open` method on a menu.
   */
  export interface IOpenOptions {
    /**
     * Whether to force the X position of the menu.
     *
     * Setting to `true` will disable the logic which repositions the
     * X coordinate of the menu if it will not fit entirely on screen.
     *
     * The default is `false`.
     */
    forceX?: boolean;

    /**
     * Whether to force the Y position of the menu.
     *
     * Setting to `true` will disable the logic which repositions the
     * Y coordinate of the menu if it will not fit entirely on screen.
     *
     * The default is `false`.
     */
    forceY?: boolean;
  }

  /**
   * A type alias for a menu item type.
   */
  export type ItemType = 'command' | 'submenu' | 'separator';

  /**
   * An options object for creating a menu item.
   */
  export interface IItemOptions {
    /**
     * The type of the menu item.
     *
     * The default value is `'command'`.
     */
    type?: ItemType;

    /**
     * The command to execute when the item is triggered.
     *
     * The default value is an empty string.
     */
    command?: string;

    /**
     * The arguments for the command.
     *
     * The default value is an empty object.
     */
    args?: ReadonlyJSONObject;

    /**
     * The submenu for a `'submenu'` type item.
     *
     * The default value is `null`.
     */
    submenu?: Menu | null;
  }

  /**
   * An object which represents a menu item.
   *
   * #### Notes
   * Item objects are created automatically by a menu.
   */
  export interface IItem {
    /**
     * The type of the menu item.
     */
    readonly type: ItemType;

    /**
     * The command to execute when the item is triggered.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: ReadonlyJSONObject;

    /**
     * The submenu for a `'submenu'` type item.
     */
    readonly submenu: Menu | null;

    /**
     * The display label for the menu item.
     */
    readonly label: string;

    /**
     * The mnemonic index for the menu item.
     */
    readonly mnemonic: number;

    /**
     * The icon renderer for the menu item.
     */
    readonly icon: VirtualElement.IRenderer | undefined;

    /**
     * The icon class for the menu item.
     */
    readonly iconClass: string;

    /**
     * The icon label for the menu item.
     */
    readonly iconLabel: string;

    /**
     * The display caption for the menu item.
     */
    readonly caption: string;

    /**
     * The extra class name for the menu item.
     */
    readonly className: string;

    /**
     * The dataset for the menu item.
     */
    readonly dataset: CommandRegistry.Dataset;

    /**
     * Whether the menu item is enabled.
     */
    readonly isEnabled: boolean;

    /**
     * Whether the menu item is toggled.
     */
    readonly isToggled: boolean;

    /**
     * Whether the menu item is visible.
     */
    readonly isVisible: boolean;

    /**
     * The key binding for the menu item.
     */
    readonly keyBinding: CommandRegistry.IKeyBinding | null;
  }

  /**
   * An object which holds the data to render a menu item.
   */
  export interface IRenderData {
    /**
     * The item to be rendered.
     */
    readonly item: IItem;

    /**
     * Whether the item is the active item.
     */
    readonly active: boolean;

    /**
     * Whether the item should be collapsed.
     */
    readonly collapsed: boolean;

    /**
     * Handler for when element is in focus.
     */
    readonly onfocus?: () => void;
  }

  /**
   * A renderer for use with a menu.
   */
  export interface IRenderer {
    /**
     * Render the virtual element for a menu item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IRenderData): VirtualElement;
  }

  /**
   * The default implementation of `IRenderer`.
   *
   * #### Notes
   * Subclasses are free to reimplement rendering methods as needed.
   */
  export class Renderer implements IRenderer {
    /**
     * Render the virtual element for a menu item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IRenderData): VirtualElement {
      let className = this.createItemClass(data);
      let dataset = this.createItemDataset(data);
      let aria = this.createItemARIA(data);
      return h.li(
        {
          className,
          dataset,
          tabindex: '0',
          onfocus: data.onfocus,
          ...aria
        },
        this.renderIcon(data),
        this.renderLabel(data),
        this.renderShortcut(data),
        this.renderSubmenu(data)
      );
    }

    /**
     * Render the icon element for a menu item.
     *
     * @param data - The data to use for rendering the icon.
     *
     * @returns A virtual element representing the item icon.
     */
    renderIcon(data: IRenderData): VirtualElement {
      let className = this.createIconClass(data);

      // If data.item.icon is undefined, it will be ignored.
      return h.div({ className }, data.item.icon!, data.item.iconLabel);
    }

    /**
     * Render the label element for a menu item.
     *
     * @param data - The data to use for rendering the label.
     *
     * @returns A virtual element representing the item label.
     */
    renderLabel(data: IRenderData): VirtualElement {
      let content = this.formatLabel(data);
      return h.div({ className: 'lm-Menu-itemLabel' }, content);
    }

    /**
     * Render the shortcut element for a menu item.
     *
     * @param data - The data to use for rendering the shortcut.
     *
     * @returns A virtual element representing the item shortcut.
     */
    renderShortcut(data: IRenderData): VirtualElement {
      let content = this.formatShortcut(data);
      return h.div({ className: 'lm-Menu-itemShortcut' }, content);
    }

    /**
     * Render the submenu icon element for a menu item.
     *
     * @param data - The data to use for rendering the submenu icon.
     *
     * @returns A virtual element representing the submenu icon.
     */
    renderSubmenu(data: IRenderData): VirtualElement {
      return h.div({ className: 'lm-Menu-itemSubmenuIcon' });
    }

    /**
     * Create the class name for the menu item.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the menu item.
     */
    createItemClass(data: IRenderData): string {
      // Setup the initial class name.
      let name = 'lm-Menu-item';

      // Add the boolean state classes.
      if (!data.item.isEnabled) {
        name += ' lm-mod-disabled';
      }
      if (data.item.isToggled) {
        name += ' lm-mod-toggled';
      }
      if (!data.item.isVisible) {
        name += ' lm-mod-hidden';
      }
      if (data.active) {
        name += ' lm-mod-active';
      }
      if (data.collapsed) {
        name += ' lm-mod-collapsed';
      }

      // Add the extra class.
      let extra = data.item.className;
      if (extra) {
        name += ` ${extra}`;
      }

      // Return the complete class name.
      return name;
    }

    /**
     * Create the dataset for the menu item.
     *
     * @param data - The data to use for creating the dataset.
     *
     * @returns The dataset for the menu item.
     */
    createItemDataset(data: IRenderData): ElementDataset {
      let result: ElementDataset;
      let { type, command, dataset } = data.item;
      if (type === 'command') {
        result = { ...dataset, type, command };
      } else {
        result = { ...dataset, type };
      }
      return result;
    }

    /**
     * Create the class name for the menu item icon.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the item icon.
     */
    createIconClass(data: IRenderData): string {
      let name = 'lm-Menu-itemIcon';
      let extra = data.item.iconClass;
      return extra ? `${name} ${extra}` : name;
    }

    /**
     * Create the aria attributes for menu item.
     *
     * @param data - The data to use for the aria attributes.
     *
     * @returns The aria attributes object for the item.
     */
    createItemARIA(data: IRenderData): ElementARIAAttrs {
      let aria: { [T in ARIAAttrNames]?: string } = {};
      switch (data.item.type) {
        case 'separator':
          aria.role = 'presentation';
          break;
        case 'submenu':
          aria['aria-haspopup'] = 'true';
          if (!data.item.isEnabled) {
            aria['aria-disabled'] = 'true';
          }
          break;
        default:
          if (!data.item.isEnabled) {
            aria['aria-disabled'] = 'true';
          }
          aria.role = 'menuitem';
      }
      return aria;
    }

    /**
     * Create the render content for the label node.
     *
     * @param data - The data to use for the label content.
     *
     * @returns The content to add to the label node.
     */
    formatLabel(data: IRenderData): h.Child {
      // Fetch the label text and mnemonic index.
      let { label, mnemonic } = data.item;

      // If the index is out of range, do not modify the label.
      if (mnemonic < 0 || mnemonic >= label.length) {
        return label;
      }

      // Split the label into parts.
      let prefix = label.slice(0, mnemonic);
      let suffix = label.slice(mnemonic + 1);
      let char = label[mnemonic];

      // Wrap the mnemonic character in a span.
      let span = h.span({ className: 'lm-Menu-itemMnemonic' }, char);

      // Return the content parts.
      return [prefix, span, suffix];
    }

    /**
     * Create the render content for the shortcut node.
     *
     * @param data - The data to use for the shortcut content.
     *
     * @returns The content to add to the shortcut node.
     */
    formatShortcut(data: IRenderData): h.Child {
      let kb = data.item.keyBinding;
      return kb
        ? kb.keys.map(CommandRegistry.formatKeystroke).join(', ')
        : null;
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export const defaultRenderer = new Renderer();
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The ms delay for opening and closing a submenu.
   */
  export const TIMER_DELAY = 300;

  /**
   * The horizontal pixel overlap for an open submenu.
   */
  export const SUBMENU_OVERLAP = 3;

  /**
   * Create the DOM node for a menu.
   */
  export function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let content = document.createElement('ul');
    content.className = 'lm-Menu-content';
    node.appendChild(content);
    content.setAttribute('role', 'menu');
    node.tabIndex = 0;
    return node;
  }

  /**
   * Test whether a menu item can be activated.
   */
  export function canActivate(item: Menu.IItem): boolean {
    return item.type !== 'separator' && item.isEnabled && item.isVisible;
  }

  /**
   * Create a new menu item for an owner menu.
   */
  export function createItem(
    owner: Menu,
    options: Menu.IItemOptions
  ): Menu.IItem {
    return new MenuItem(owner.commands, options);
  }

  /**
   * Hit test a menu hierarchy starting at the given root.
   */
  export function hitTestMenus(menu: Menu, x: number, y: number): boolean {
    for (let temp: Menu | null = menu; temp; temp = temp.childMenu) {
      if (ElementExt.hitTest(temp.node, x, y)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Compute which extra separator items should be collapsed.
   */
  export function computeCollapsed(
    items: ReadonlyArray<Menu.IItem>
  ): boolean[] {
    // Allocate the return array and fill it with `false`.
    let result = new Array<boolean>(items.length);
    ArrayExt.fill(result, false);

    // Collapse the leading separators.
    let k1 = 0;
    let n = items.length;
    for (; k1 < n; ++k1) {
      let item = items[k1];
      if (!item.isVisible) {
        continue;
      }
      if (item.type !== 'separator') {
        break;
      }
      result[k1] = true;
    }

    // Hide the trailing separators.
    let k2 = n - 1;
    for (; k2 >= 0; --k2) {
      let item = items[k2];
      if (!item.isVisible) {
        continue;
      }
      if (item.type !== 'separator') {
        break;
      }
      result[k2] = true;
    }

    // Hide the remaining consecutive separators.
    let hide = false;
    while (++k1 < k2) {
      let item = items[k1];
      if (!item.isVisible) {
        continue;
      }
      if (item.type !== 'separator') {
        hide = false;
      } else if (hide) {
        result[k1] = true;
      } else {
        hide = true;
      }
    }

    // Return the resulting flags.
    return result;
  }

  /**
   * Open a menu as a root menu at the target location.
   */
  export function openRootMenu(
    menu: Menu,
    x: number,
    y: number,
    forceX: boolean,
    forceY: boolean
  ): void {
    // Ensure the menu is updated before attaching and measuring.
    MessageLoop.sendMessage(menu, Widget.Msg.UpdateRequest);

    // Get the current position and size of the main viewport.
    let px = window.pageXOffset;
    let py = window.pageYOffset;
    let cw = document.documentElement.clientWidth;
    let ch = document.documentElement.clientHeight;

    // Compute the maximum allowed height for the menu.
    let maxHeight = ch - (forceY ? y : 0);

    // Fetch common variables.
    let node = menu.node;
    let style = node.style;

    // Clear the menu geometry and prepare it for measuring.
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
    style.visibility = 'hidden';
    style.maxHeight = `${maxHeight}px`;

    // Attach the menu to the document.
    Widget.attach(menu, document.body);

    // Measure the size of the menu.
    let { width, height } = node.getBoundingClientRect();

    // Adjust the X position of the menu to fit on-screen.
    if (!forceX && x + width > px + cw) {
      x = px + cw - width;
    }

    // Adjust the Y position of the menu to fit on-screen.
    if (!forceY && y + height > py + ch) {
      if (y > py + ch) {
        y = py + ch - height;
      } else {
        y = y - height;
      }
    }

    // Update the position of the menu to the computed position.
    style.top = `${Math.max(0, y)}px`;
    style.left = `${Math.max(0, x)}px`;

    // Finally, make the menu visible on the screen.
    style.visibility = '';
  }

  /**
   * Open a menu as a submenu using an item node for positioning.
   */
  export function openSubmenu(submenu: Menu, itemNode: HTMLElement): void {
    // Ensure the menu is updated before opening.
    MessageLoop.sendMessage(submenu, Widget.Msg.UpdateRequest);

    // Get the current position and size of the main viewport.
    let px = window.pageXOffset;
    let py = window.pageYOffset;
    let cw = document.documentElement.clientWidth;
    let ch = document.documentElement.clientHeight;

    // Compute the maximum allowed height for the menu.
    let maxHeight = ch;

    // Fetch common variables.
    let node = submenu.node;
    let style = node.style;

    // Clear the menu geometry and prepare it for measuring.
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
    style.visibility = 'hidden';
    style.maxHeight = `${maxHeight}px`;

    // Attach the menu to the document.
    Widget.attach(submenu, document.body);

    // Measure the size of the menu.
    let { width, height } = node.getBoundingClientRect();

    // Compute the box sizing for the menu.
    let box = ElementExt.boxSizing(submenu.node);

    // Get the bounding rect for the target item node.
    let itemRect = itemNode.getBoundingClientRect();

    // Compute the target X position.
    let x = itemRect.right - SUBMENU_OVERLAP;

    // Adjust the X position to fit on the screen.
    if (x + width > px + cw) {
      x = itemRect.left + SUBMENU_OVERLAP - width;
    }

    // Compute the target Y position.
    let y = itemRect.top - box.borderTop - box.paddingTop;

    // Adjust the Y position to fit on the screen.
    if (y + height > py + ch) {
      y = itemRect.bottom + box.borderBottom + box.paddingBottom - height;
    }

    // Update the position of the menu to the computed position.
    style.top = `${Math.max(0, y)}px`;
    style.left = `${Math.max(0, x)}px`;

    // Finally, make the menu visible on the screen.
    style.visibility = '';
  }

  /**
   * The results of a mnemonic search.
   */
  export interface IMnemonicResult {
    /**
     * The index of the first matching mnemonic item, or `-1`.
     */
    index: number;

    /**
     * Whether multiple mnemonic items matched.
     */
    multiple: boolean;

    /**
     * The index of the first auto matched non-mnemonic item.
     */
    auto: number;
  }

  /**
   * Find the best matching mnemonic item.
   *
   * The search starts at the given index and wraps around.
   */
  export function findMnemonic(
    items: ReadonlyArray<Menu.IItem>,
    key: string,
    start: number
  ): IMnemonicResult {
    // Setup the result variables.
    let index = -1;
    let auto = -1;
    let multiple = false;

    // Normalize the key to upper case.
    let upperKey = key.toUpperCase();

    // Search the items from the given start index.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Compute the wrapped index.
      let k = (i + start) % n;

      // Lookup the item
      let item = items[k];

      // Ignore items which cannot be activated.
      if (!canActivate(item)) {
        continue;
      }

      // Ignore items with an empty label.
      let label = item.label;
      if (label.length === 0) {
        continue;
      }

      // Lookup the mnemonic index for the label.
      let mn = item.mnemonic;

      // Handle a valid mnemonic index.
      if (mn >= 0 && mn < label.length) {
        if (label[mn].toUpperCase() === upperKey) {
          if (index === -1) {
            index = k;
          } else {
            multiple = true;
          }
        }
        continue;
      }

      // Finally, handle the auto index if possible.
      if (auto === -1 && label[0].toUpperCase() === upperKey) {
        auto = k;
      }
    }

    // Return the search results.
    return { index, multiple, auto };
  }

  /**
   * A concrete implementation of `Menu.IItem`.
   */
  class MenuItem implements Menu.IItem {
    /**
     * Construct a new menu item.
     */
    constructor(commands: CommandRegistry, options: Menu.IItemOptions) {
      this._commands = commands;
      this.type = options.type || 'command';
      this.command = options.command || '';
      this.args = options.args || JSONExt.emptyObject;
      this.submenu = options.submenu || null;
    }

    /**
     * The type of the menu item.
     */
    readonly type: Menu.ItemType;

    /**
     * The command to execute when the item is triggered.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: ReadonlyJSONObject;

    /**
     * The submenu for a `'submenu'` type item.
     */
    readonly submenu: Menu | null;

    /**
     * The display label for the menu item.
     */
    get label(): string {
      if (this.type === 'command') {
        return this._commands.label(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.label;
      }
      return '';
    }

    /**
     * The mnemonic index for the menu item.
     */
    get mnemonic(): number {
      if (this.type === 'command') {
        return this._commands.mnemonic(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.mnemonic;
      }
      return -1;
    }

    /**
     * The icon renderer for the menu item.
     */
    get icon(): VirtualElement.IRenderer | undefined {
      if (this.type === 'command') {
        return this._commands.icon(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.icon;
      }
      return undefined;
    }

    /**
     * The icon class for the menu item.
     */
    get iconClass(): string {
      if (this.type === 'command') {
        return this._commands.iconClass(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.iconClass;
      }
      return '';
    }

    /**
     * The icon label for the menu item.
     */
    get iconLabel(): string {
      if (this.type === 'command') {
        return this._commands.iconLabel(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.iconLabel;
      }
      return '';
    }

    /**
     * The display caption for the menu item.
     */
    get caption(): string {
      if (this.type === 'command') {
        return this._commands.caption(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.caption;
      }
      return '';
    }

    /**
     * The extra class name for the menu item.
     */
    get className(): string {
      if (this.type === 'command') {
        return this._commands.className(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.className;
      }
      return '';
    }

    /**
     * The dataset for the menu item.
     */
    get dataset(): CommandRegistry.Dataset {
      if (this.type === 'command') {
        return this._commands.dataset(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.dataset;
      }
      return {};
    }

    /**
     * Whether the menu item is enabled.
     */
    get isEnabled(): boolean {
      if (this.type === 'command') {
        return this._commands.isEnabled(this.command, this.args);
      }
      if (this.type === 'submenu') {
        return this.submenu !== null;
      }
      return true;
    }

    /**
     * Whether the menu item is toggled.
     */
    get isToggled(): boolean {
      if (this.type === 'command') {
        return this._commands.isToggled(this.command, this.args);
      }
      return false;
    }

    /**
     * Whether the menu item is visible.
     */
    get isVisible(): boolean {
      if (this.type === 'command') {
        return this._commands.isVisible(this.command, this.args);
      }
      if (this.type === 'submenu') {
        return this.submenu !== null;
      }
      return true;
    }

    /**
     * The key binding for the menu item.
     */
    get keyBinding(): CommandRegistry.IKeyBinding | null {
      if (this.type === 'command') {
        let { command, args } = this;
        return (
          ArrayExt.findLastValue(this._commands.keyBindings, kb => {
            return kb.command === command && JSONExt.deepEqual(kb.args, args);
          }) || null
        );
      }
      return null;
    }

    private _commands: CommandRegistry;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { ElementExt } from '@lumino/domutils';

import { getKeyboardLayout } from '@lumino/keyboard';

import { Message, MessageLoop } from '@lumino/messaging';

import {
  ElementARIAAttrs,
  ElementDataset,
  h,
  VirtualDOM,
  VirtualElement
} from '@lumino/virtualdom';

import { Menu } from './menu';

import { Title } from './title';

import { Widget } from './widget';

/**
 * A widget which displays menus as a canonical menu bar.
 */
export class MenuBar extends Widget {
  /**
   * Construct a new menu bar.
   *
   * @param options - The options for initializing the menu bar.
   */
  constructor(options: MenuBar.IOptions = {}) {
    super({ node: Private.createNode() });
    this.addClass('lm-MenuBar');
    this.setFlag(Widget.Flag.DisallowLayout);
    this.renderer = options.renderer || MenuBar.defaultRenderer;
    this._forceItemsPosition = options.forceItemsPosition || {
      forceX: true,
      forceY: true
    };
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._closeChildMenu();
    this._menus.length = 0;
    super.dispose();
  }

  /**
   * The renderer used by the menu bar.
   */
  readonly renderer: MenuBar.IRenderer;

  /**
   * The child menu of the menu bar.
   *
   * #### Notes
   * This will be `null` if the menu bar does not have an open menu.
   */
  get childMenu(): Menu | null {
    return this._childMenu;
  }

  /**
   * Get the menu bar content node.
   *
   * #### Notes
   * This is the node which holds the menu title nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(
      'lm-MenuBar-content'
    )[0] as HTMLUListElement;
  }

  /**
   * Get the currently active menu.
   */
  get activeMenu(): Menu | null {
    return this._menus[this._activeIndex] || null;
  }

  /**
   * Set the currently active menu.
   *
   * #### Notes
   * If the menu does not exist, the menu will be set to `null`.
   */
  set activeMenu(value: Menu | null) {
    this.activeIndex = value ? this._menus.indexOf(value) : -1;
  }

  /**
   * Get the index of the currently active menu.
   *
   * #### Notes
   * This will be `-1` if no menu is active.
   */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * Set the index of the currently active menu.
   *
   * #### Notes
   * If the menu cannot be activated, the index will be set to `-1`.
   */
  set activeIndex(value: number) {
    // Adjust the value for an out of range index.
    if (value < 0 || value >= this._menus.length) {
      value = -1;
    }

    // Bail early if the index will not change.
    if (this._activeIndex === value) {
      return;
    }

    // Update the active index.
    this._activeIndex = value;

    // Update focus to new active index
    if (
      this._activeIndex >= 0 &&
      this.contentNode.childNodes[this._activeIndex]
    ) {
      (this.contentNode.childNodes[this._activeIndex] as HTMLElement).focus();
    }

    // Schedule an update of the items.
    this.update();
  }

  /**
   * A read-only array of the menus in the menu bar.
   */
  get menus(): ReadonlyArray<Menu> {
    return this._menus;
  }

  /**
   * Open the active menu and activate its first menu item.
   *
   * #### Notes
   * If there is no active menu, this is a no-op.
   */
  openActiveMenu(): void {
    // Bail early if there is no active item.
    if (this._activeIndex === -1) {
      return;
    }

    // Open the child menu.
    this._openChildMenu();

    // Activate the first item in the child menu.
    if (this._childMenu) {
      this._childMenu.activeIndex = -1;
      this._childMenu.activateNextItem();
    }
  }

  /**
   * Add a menu to the end of the menu bar.
   *
   * @param menu - The menu to add to the menu bar.
   *
   * #### Notes
   * If the menu is already added to the menu bar, it will be moved.
   */
  addMenu(menu: Menu): void {
    this.insertMenu(this._menus.length, menu);
  }

  /**
   * Insert a menu into the menu bar at the specified index.
   *
   * @param index - The index at which to insert the menu.
   *
   * @param menu - The menu to insert into the menu bar.
   *
   * #### Notes
   * The index will be clamped to the bounds of the menus.
   *
   * If the menu is already added to the menu bar, it will be moved.
   */
  insertMenu(index: number, menu: Menu): void {
    // Close the child menu before making changes.
    this._closeChildMenu();

    // Look up the index of the menu.
    let i = this._menus.indexOf(menu);

    // Clamp the insert index to the array bounds.
    let j = Math.max(0, Math.min(index, this._menus.length));

    // If the menu is not in the array, insert it.
    if (i === -1) {
      // Insert the menu into the array.
      ArrayExt.insert(this._menus, j, menu);

      // Add the styling class to the menu.
      menu.addClass('lm-MenuBar-menu');

      // Connect to the menu signals.
      menu.aboutToClose.connect(this._onMenuAboutToClose, this);
      menu.menuRequested.connect(this._onMenuMenuRequested, this);
      menu.title.changed.connect(this._onTitleChanged, this);

      // Schedule an update of the items.
      this.update();

      // There is nothing more to do.
      return;
    }

    // Otherwise, the menu exists in the array and should be moved.

    // Adjust the index if the location is at the end of the array.
    if (j === this._menus.length) {
      j--;
    }

    // Bail if there is no effective move.
    if (i === j) {
      return;
    }

    // Move the menu to the new locations.
    ArrayExt.move(this._menus, i, j);

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Remove a menu from the menu bar.
   *
   * @param menu - The menu to remove from the menu bar.
   *
   * #### Notes
   * This is a no-op if the menu is not in the menu bar.
   */
  removeMenu(menu: Menu): void {
    this.removeMenuAt(this._menus.indexOf(menu));
  }

  /**
   * Remove the menu at a given index from the menu bar.
   *
   * @param index - The index of the menu to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeMenuAt(index: number): void {
    // Close the child menu before making changes.
    this._closeChildMenu();

    // Remove the menu from the array.
    let menu = ArrayExt.removeAt(this._menus, index);

    // Bail if the index is out of range.
    if (!menu) {
      return;
    }

    // Disconnect from the menu signals.
    menu.aboutToClose.disconnect(this._onMenuAboutToClose, this);
    menu.menuRequested.disconnect(this._onMenuMenuRequested, this);
    menu.title.changed.disconnect(this._onTitleChanged, this);

    // Remove the styling class from the menu.
    menu.removeClass('lm-MenuBar-menu');

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Remove all menus from the menu bar.
   */
  clearMenus(): void {
    // Bail if there is nothing to remove.
    if (this._menus.length === 0) {
      return;
    }

    // Close the child menu before making changes.
    this._closeChildMenu();

    // Disconnect from the menu signals and remove the styling class.
    for (let menu of this._menus) {
      menu.aboutToClose.disconnect(this._onMenuAboutToClose, this);
      menu.menuRequested.disconnect(this._onMenuMenuRequested, this);
      menu.title.changed.disconnect(this._onTitleChanged, this);
      menu.removeClass('lm-MenuBar-menu');
    }

    // Clear the menus array.
    this._menus.length = 0;

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Handle the DOM events for the menu bar.
   *
   * @param event - The DOM event sent to the menu bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the menu bar's DOM nodes. It
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
      case 'mouseleave':
        this._evtMouseLeave(event as MouseEvent);
        break;
      case 'contextmenu':
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('keydown', this);
    this.node.addEventListener('mousedown', this);
    this.node.addEventListener('mousemove', this);
    this.node.addEventListener('mouseleave', this);
    this.node.addEventListener('contextmenu', this);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('keydown', this);
    this.node.removeEventListener('mousedown', this);
    this.node.removeEventListener('mousemove', this);
    this.node.removeEventListener('mouseleave', this);
    this.node.removeEventListener('contextmenu', this);
    this._closeChildMenu();
  }

  /**
   * A message handler invoked on an `'activate-request'` message.
   */
  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      this.node.focus();
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    let menus = this._menus;
    let renderer = this.renderer;
    let activeIndex = this._activeIndex;
    let content = new Array<VirtualElement>(menus.length);
    for (let i = 0, n = menus.length; i < n; ++i) {
      let title = menus[i].title;
      let active = i === activeIndex;
      if (active && menus[i].items.length == 0) {
        active = false;
      }
      content[i] = renderer.renderItem({
        title,
        active,
        onfocus: () => {
          this.activeIndex = i;
        }
      });
    }
    VirtualDOM.render(content, this.contentNode);
  }

  /**
   * Handle the `'keydown'` event for the menu bar.
   *
   * #### Notes
   * All keys are trapped except the tab key that is ignored.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Fetch the key code for the event.
    let kc = event.keyCode;

    // Do not trap the tab key.
    if (kc === 9) {
      return;
    }

    // A menu bar handles all other keydown events.
    event.preventDefault();
    event.stopPropagation();

    // Enter, Up Arrow, Down Arrow
    if (kc === 13 || kc === 38 || kc === 40) {
      this.openActiveMenu();
      return;
    }

    // Escape
    if (kc === 27) {
      this._closeChildMenu();
      this.activeIndex = -1;
      this.node.blur();
      return;
    }

    // Left Arrow
    if (kc === 37) {
      let i = this._activeIndex;
      let n = this._menus.length;
      this.activeIndex = i === 0 ? n - 1 : i - 1;
      return;
    }

    // Right Arrow
    if (kc === 39) {
      let i = this._activeIndex;
      let n = this._menus.length;
      this.activeIndex = i === n - 1 ? 0 : i + 1;
      return;
    }

    // Get the pressed key character.
    let key = getKeyboardLayout().keyForKeydownEvent(event);

    // Bail if the key is not valid.
    if (!key) {
      return;
    }

    // Search for the next best matching mnemonic item.
    let start = this._activeIndex + 1;
    let result = Private.findMnemonic(this._menus, key, start);

    // Handle the requested mnemonic based on the search results.
    // If exactly one mnemonic is matched, that menu is opened.
    // Otherwise, the next mnemonic is activated if available,
    // followed by the auto mnemonic if available.
    if (result.index !== -1 && !result.multiple) {
      this.activeIndex = result.index;
      this.openActiveMenu();
    } else if (result.index !== -1) {
      this.activeIndex = result.index;
    } else if (result.auto !== -1) {
      this.activeIndex = result.auto;
    }
  }

  /**
   * Handle the `'mousedown'` event for the menu bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Bail if the mouse press was not on the menu bar. This can occur
    // when the document listener is installed for an active menu bar.
    if (!ElementExt.hitTest(this.node, event.clientX, event.clientY)) {
      return;
    }

    // Stop the propagation of the event. Immediate propagation is
    // also stopped so that an open menu does not handle the event.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Check if the mouse is over one of the menu items.
    let index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return ElementExt.hitTest(node, event.clientX, event.clientY);
    });

    // If the press was not on an item, close the child menu.
    if (index === -1) {
      this._closeChildMenu();
      return;
    }

    // If the press was not the left mouse button, do nothing further.
    if (event.button !== 0) {
      return;
    }

    // Otherwise, toggle the open state of the child menu.
    if (this._childMenu) {
      this._closeChildMenu();
      this.activeIndex = index;
    } else {
      this.activeIndex = index;
      this._openChildMenu();
    }
  }

  /**
   * Handle the `'mousemove'` event for the menu bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Check if the mouse is over one of the menu items.
    let index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return ElementExt.hitTest(node, event.clientX, event.clientY);
    });

    // Bail early if the active index will not change.
    if (index === this._activeIndex) {
      return;
    }

    // Bail early if a child menu is open and the mouse is not over
    // an item. This allows the child menu to be kept open when the
    // mouse is over the empty part of the menu bar.
    if (index === -1 && this._childMenu) {
      return;
    }

    // Update the active index to the hovered item.
    this.activeIndex = index;

    // Open the new menu if a menu is already open.
    if (this._childMenu) {
      this._openChildMenu();
    }
  }

  /**
   * Handle the `'mouseleave'` event for the menu bar.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    // Reset the active index if there is no open menu.
    if (!this._childMenu) {
      this.activeIndex = -1;
    }
  }

  /**
   * Open the child menu at the active index immediately.
   *
   * If a different child menu is already open, it will be closed,
   * even if there is no active menu.
   */
  private _openChildMenu(): void {
    // If there is no active menu, close the current menu.
    let newMenu = this.activeMenu;
    if (!newMenu) {
      this._closeChildMenu();
      return;
    }

    // Bail if there is no effective menu change.
    let oldMenu = this._childMenu;
    if (oldMenu === newMenu) {
      return;
    }

    // Swap the internal menu reference.
    this._childMenu = newMenu;

    // Close the current menu, or setup for the new menu.
    if (oldMenu) {
      oldMenu.close();
    } else {
      this.addClass('lm-mod-active');
      document.addEventListener('mousedown', this, true);
    }

    // Ensure the menu bar is updated and look up the item node.
    MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);
    let itemNode = this.contentNode.children[this._activeIndex];

    // Get the positioning data for the new menu.
    let { left, bottom } = (itemNode as HTMLElement).getBoundingClientRect();

    // Open the new menu at the computed location.
    if (newMenu.items.length > 0) {
      newMenu.open(left, bottom, this._forceItemsPosition);
    }
  }

  /**
   * Close the child menu immediately.
   *
   * This is a no-op if a child menu is not open.
   */
  private _closeChildMenu(): void {
    // Bail if no child menu is open.
    if (!this._childMenu) {
      return;
    }

    // Remove the active class from the menu bar.
    this.removeClass('lm-mod-active');

    // Remove the document listeners.
    document.removeEventListener('mousedown', this, true);

    // Clear the internal menu reference.
    let menu = this._childMenu;
    this._childMenu = null;

    // Close the menu.
    menu.close();

    // Reset the active index.
    this.activeIndex = -1;
  }

  /**
   * Handle the `aboutToClose` signal of a menu.
   */
  private _onMenuAboutToClose(sender: Menu): void {
    // Bail if the sender is not the child menu.
    if (sender !== this._childMenu) {
      return;
    }

    // Remove the active class from the menu bar.
    this.removeClass('lm-mod-active');

    // Remove the document listeners.
    document.removeEventListener('mousedown', this, true);

    // Clear the internal menu reference.
    this._childMenu = null;

    // Reset the active index.
    this.activeIndex = -1;
  }

  /**
   * Handle the `menuRequested` signal of a child menu.
   */
  private _onMenuMenuRequested(sender: Menu, args: 'next' | 'previous'): void {
    // Bail if the sender is not the child menu.
    if (sender !== this._childMenu) {
      return;
    }

    // Look up the active index and menu count.
    let i = this._activeIndex;
    let n = this._menus.length;

    // Active the next requested index.
    switch (args) {
      case 'next':
        this.activeIndex = i === n - 1 ? 0 : i + 1;
        break;
      case 'previous':
        this.activeIndex = i === 0 ? n - 1 : i - 1;
        break;
    }

    // Open the active menu.
    this.openActiveMenu();
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(): void {
    this.update();
  }

  private _activeIndex = -1;
  private _forceItemsPosition: Menu.IOpenOptions;
  private _menus: Menu[] = [];
  private _childMenu: Menu | null = null;
}

/**
 * The namespace for the `MenuBar` class statics.
 */
export namespace MenuBar {
  /**
   * An options object for creating a menu bar.
   */
  export interface IOptions {
    /**
     * A custom renderer for creating menu bar content.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
    /**
     * Whether to force the position of the menu. The MenuBar forces the
     * coordinates of its menus by default. With this option you can disable it.
     *
     * Setting to `false` will enable the logic which repositions the
     * coordinates of the menu if it will not fit entirely on screen.
     *
     * The default is `true`.
     */
    forceItemsPosition?: Menu.IOpenOptions;
  }

  /**
   * An object which holds the data to render a menu bar item.
   */
  export interface IRenderData {
    /**
     * The title to be rendered.
     */
    readonly title: Title<Widget>;

    /**
     * Whether the item is the active item.
     */
    readonly active: boolean;

    readonly onfocus?: (event: FocusEvent) => void;
  }

  /**
   * A renderer for use with a menu bar.
   */
  export interface IRenderer {
    /**
     * Render the virtual element for a menu bar item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IRenderData): VirtualElement;
  }

  /**
   * The default implementation of `IRenderer`.
   *
   * #### Notes
   * Subclasses are free to reimplement rendering methods as needed.
   */
  export class Renderer implements IRenderer {
    /**
     * Render the virtual element for a menu bar item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IRenderData): VirtualElement {
      let className = this.createItemClass(data);
      let dataset = this.createItemDataset(data);
      let aria = this.createItemARIA(data);
      return h.li(
        { className, dataset, tabindex: '0', onfocus: data.onfocus, ...aria },
        this.renderIcon(data),
        this.renderLabel(data)
      );
    }

    /**
     * Render the icon element for a menu bar item.
     *
     * @param data - The data to use for rendering the icon.
     *
     * @returns A virtual element representing the item icon.
     */
    renderIcon(data: IRenderData): VirtualElement {
      let className = this.createIconClass(data);

      // If data.title.icon is undefined, it will be ignored.
      return h.div({ className }, data.title.icon!, data.title.iconLabel);
    }

    /**
     * Render the label element for a menu item.
     *
     * @param data - The data to use for rendering the label.
     *
     * @returns A virtual element representing the item label.
     */
    renderLabel(data: IRenderData): VirtualElement {
      let content = this.formatLabel(data);
      return h.div({ className: 'lm-MenuBar-itemLabel' }, content);
    }

    /**
     * Create the class name for the menu bar item.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the menu item.
     */
    createItemClass(data: IRenderData): string {
      let name = 'lm-MenuBar-item';
      if (data.title.className) {
        name += ` ${data.title.className}`;
      }
      if (data.active) {
        name += ' lm-mod-active';
      }
      return name;
    }

    /**
     * Create the dataset for a menu bar item.
     *
     * @param data - The data to use for the item.
     *
     * @returns The dataset for the menu bar item.
     */
    createItemDataset(data: IRenderData): ElementDataset {
      return data.title.dataset;
    }

    /**
     * Create the aria attributes for menu bar item.
     *
     * @param data - The data to use for the aria attributes.
     *
     * @returns The aria attributes object for the item.
     */
    createItemARIA(data: IRenderData): ElementARIAAttrs {
      return { role: 'menuitem', 'aria-haspopup': 'true' };
    }

    /**
     * Create the class name for the menu bar item icon.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the item icon.
     */
    createIconClass(data: IRenderData): string {
      let name = 'lm-MenuBar-itemIcon';
      let extra = data.title.iconClass;
      return extra ? `${name} ${extra}` : name;
    }

    /**
     * Create the render content for the label node.
     *
     * @param data - The data to use for the label content.
     *
     * @returns The content to add to the label node.
     */
    formatLabel(data: IRenderData): h.Child {
      // Fetch the label text and mnemonic index.
      let { label, mnemonic } = data.title;

      // If the index is out of range, do not modify the label.
      if (mnemonic < 0 || mnemonic >= label.length) {
        return label;
      }

      // Split the label into parts.
      let prefix = label.slice(0, mnemonic);
      let suffix = label.slice(mnemonic + 1);
      let char = label[mnemonic];

      // Wrap the mnemonic character in a span.
      let span = h.span({ className: 'lm-MenuBar-itemMnemonic' }, char);

      // Return the content parts.
      return [prefix, span, suffix];
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export const defaultRenderer = new Renderer();
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create the DOM node for a menu bar.
   */
  export function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let content = document.createElement('ul');
    content.className = 'lm-MenuBar-content';
    node.appendChild(content);
    content.setAttribute('role', 'menubar');
    node.tabIndex = 0;
    content.tabIndex = 0;
    return node;
  }

  /**
   * The results of a mnemonic search.
   */
  export interface IMnemonicResult {
    /**
     * The index of the first matching mnemonic item, or `-1`.
     */
    index: number;

    /**
     * Whether multiple mnemonic items matched.
     */
    multiple: boolean;

    /**
     * The index of the first auto matched non-mnemonic item.
     */
    auto: number;
  }

  /**
   * Find the best matching mnemonic item.
   *
   * The search starts at the given index and wraps around.
   */
  export function findMnemonic(
    menus: ReadonlyArray<Menu>,
    key: string,
    start: number
  ): IMnemonicResult {
    // Setup the result variables.
    let index = -1;
    let auto = -1;
    let multiple = false;

    // Normalize the key to upper case.
    let upperKey = key.toUpperCase();

    // Search the items from the given start index.
    for (let i = 0, n = menus.length; i < n; ++i) {
      // Compute the wrapped index.
      let k = (i + start) % n;

      // Look up the menu title.
      let title = menus[k].title;

      // Ignore titles with an empty label.
      if (title.label.length === 0) {
        continue;
      }

      // Look up the mnemonic index for the label.
      let mn = title.mnemonic;

      // Handle a valid mnemonic index.
      if (mn >= 0 && mn < title.label.length) {
        if (title.label[mn].toUpperCase() === upperKey) {
          if (index === -1) {
            index = k;
          } else {
            multiple = true;
          }
        }
        continue;
      }

      // Finally, handle the auto index if possible.
      if (auto === -1 && title.label[0].toUpperCase() === upperKey) {
        auto = k;
      }
    }

    // Return the search results.
    return { index, multiple, auto };
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { PanelLayout } from './panellayout';

import { Widget } from './widget';

/**
 * A simple and convenient panel widget class.
 *
 * #### Notes
 * This class is suitable as a base class for implementing a variety of
 * convenience panel widgets, but can also be used directly with CSS to
 * arrange a collection of widgets.
 *
 * This class provides a convenience wrapper around a [[PanelLayout]].
 */
export class Panel extends Widget {
  /**
   * Construct a new panel.
   *
   * @param options - The options for initializing the panel.
   */
  constructor(options: Panel.IOptions = {}) {
    super();
    this.addClass('lm-Panel');
    this.layout = Private.createLayout(options);
  }

  /**
   * A read-only array of the widgets in the panel.
   */
  get widgets(): ReadonlyArray<Widget> {
    return (this.layout as PanelLayout).widgets;
  }

  /**
   * Add a widget to the end of the panel.
   *
   * @param widget - The widget to add to the panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   */
  addWidget(widget: Widget): void {
    (this.layout as PanelLayout).addWidget(widget);
  }

  /**
   * Insert a widget at the specified index.
   *
   * @param index - The index at which to insert the widget.
   *
   * @param widget - The widget to insert into to the panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   */
  insertWidget(index: number, widget: Widget): void {
    (this.layout as PanelLayout).insertWidget(index, widget);
  }
}

/**
 * The namespace for the `Panel` class statics.
 */
export namespace Panel {
  /**
   * An options object for creating a panel.
   */
  export interface IOptions {
    /**
     * The panel layout to use for the panel.
     *
     * The default is a new `PanelLayout`.
     */
    layout?: PanelLayout;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create a panel layout for the given panel options.
   */
  export function createLayout(options: Panel.IOptions): PanelLayout {
    return options.layout || new PanelLayout();
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { MessageLoop } from '@lumino/messaging';

import { Layout } from './layout';

import { Widget } from './widget';

/**
 * A concrete layout implementation suitable for many use cases.
 *
 * #### Notes
 * This class is suitable as a base class for implementing a variety of
 * layouts, but can also be used directly with standard CSS to layout a
 * collection of widgets.
 */
export class PanelLayout extends Layout {
  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This will clear and dispose all widgets in the layout.
   *
   * All reimplementations should call the superclass method.
   *
   * This method is called automatically when the parent is disposed.
   */
  dispose(): void {
    while (this._widgets.length > 0) {
      this._widgets.pop()!.dispose();
    }
    super.dispose();
  }

  /**
   * A read-only array of the widgets in the layout.
   */
  get widgets(): ReadonlyArray<Widget> {
    return this._widgets;
  }

  /**
   * Create an iterator over the widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   */
  *[Symbol.iterator](): IterableIterator<Widget> {
    yield* this._widgets;
  }

  /**
   * Add a widget to the end of the layout.
   *
   * @param widget - The widget to add to the layout.
   *
   * #### Notes
   * If the widget is already contained in the layout, it will be moved.
   */
  addWidget(widget: Widget): void {
    this.insertWidget(this._widgets.length, widget);
  }

  /**
   * Insert a widget into the layout at the specified index.
   *
   * @param index - The index at which to insert the widget.
   *
   * @param widget - The widget to insert into the layout.
   *
   * #### Notes
   * The index will be clamped to the bounds of the widgets.
   *
   * If the widget is already added to the layout, it will be moved.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  insertWidget(index: number, widget: Widget): void {
    // Remove the widget from its current parent. This is a no-op
    // if the widget's parent is already the layout parent widget.
    widget.parent = this.parent;

    // Look up the current index of the widget.
    let i = this._widgets.indexOf(widget);

    // Clamp the insert index to the array bounds.
    let j = Math.max(0, Math.min(index, this._widgets.length));

    // If the widget is not in the array, insert it.
    if (i === -1) {
      // Insert the widget into the array.
      ArrayExt.insert(this._widgets, j, widget);

      // If the layout is parented, attach the widget to the DOM.
      if (this.parent) {
        this.attachWidget(j, widget);
      }

      // There is nothing more to do.
      return;
    }

    // Otherwise, the widget exists in the array and should be moved.

    // Adjust the index if the location is at the end of the array.
    if (j === this._widgets.length) {
      j--;
    }

    // Bail if there is no effective move.
    if (i === j) {
      return;
    }

    // Move the widget to the new location.
    ArrayExt.move(this._widgets, i, j);

    // If the layout is parented, move the widget in the DOM.
    if (this.parent) {
      this.moveWidget(i, j, widget);
    }
  }

  /**
   * Remove a widget from the layout.
   *
   * @param widget - The widget to remove from the layout.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method does *not* modify the widget's `parent`.
   */
  removeWidget(widget: Widget): void {
    this.removeWidgetAt(this._widgets.indexOf(widget));
  }

  /**
   * Remove the widget at a given index from the layout.
   *
   * @param index - The index of the widget to remove.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method does *not* modify the widget's `parent`.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  removeWidgetAt(index: number): void {
    // Remove the widget from the array.
    let widget = ArrayExt.removeAt(this._widgets, index);

    // If the layout is parented, detach the widget from the DOM.
    if (widget && this.parent) {
      this.detachWidget(index, widget);
    }
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    super.init();
    let index = 0;
    for (const widget of this) {
      this.attachWidget(index++, widget);
    }
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param index - The current index of the widget in the layout.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This method is called automatically by the panel layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation adds the widgets's node to the parent's
   * node at the proper location, and sends the appropriate attach
   * messages to the widget if the parent is attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the widget's
   * node is added to the parent's node.
   */
  protected attachWidget(index: number, widget: Widget): void {
    // Look up the next sibling reference node.
    let ref = this.parent!.node.children[index];

    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Insert the widget's node before the sibling.
    this.parent!.node.insertBefore(widget.node, ref);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }
  }

  /**
   * Move a widget in the parent's DOM node.
   *
   * @param fromIndex - The previous index of the widget in the layout.
   *
   * @param toIndex - The current index of the widget in the layout.
   *
   * @param widget - The widget to move in the parent.
   *
   * #### Notes
   * This method is called automatically by the panel layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation moves the widget's node to the proper
   * location in the parent's node and sends the appropriate attach and
   * detach messages to the widget if the parent is attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the widget's
   * node is moved in the parent's node.
   */
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` and  message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }

    // Look up the next sibling reference node.
    let ref = this.parent!.node.children[toIndex];

    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Insert the widget's node before the sibling.
    this.parent!.node.insertBefore(widget.node, ref);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param index - The previous index of the widget in the layout.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This method is called automatically by the panel layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation removes the widget's node from the
   * parent's node, and sends the appropriate detach messages to the
   * widget if the parent is attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the widget's
   * node is removed from the parent's node.
   */
  protected detachWidget(index: number, widget: Widget): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }
  }

  private _widgets: Widget[] = [];
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { IDisposable } from '@lumino/disposable';

import { ElementExt } from '@lumino/domutils';

import { Drag } from '@lumino/dragdrop';

import { Message } from '@lumino/messaging';

import { ISignal, Signal } from '@lumino/signaling';

import { Widget } from './widget';

/**
 * A widget which implements a canonical scroll bar.
 */
export class ScrollBar extends Widget {
  /**
   * Construct a new scroll bar.
   *
   * @param options - The options for initializing the scroll bar.
   */
  constructor(options: ScrollBar.IOptions = {}) {
    super({ node: Private.createNode() });
    this.addClass('lm-ScrollBar');
    this.setFlag(Widget.Flag.DisallowLayout);

    // Set the orientation.
    this._orientation = options.orientation || 'vertical';
    this.dataset['orientation'] = this._orientation;

    // Parse the rest of the options.
    if (options.maximum !== undefined) {
      this._maximum = Math.max(0, options.maximum);
    }
    if (options.page !== undefined) {
      this._page = Math.max(0, options.page);
    }
    if (options.value !== undefined) {
      this._value = Math.max(0, Math.min(options.value, this._maximum));
    }
  }

  /**
   * A signal emitted when the user moves the scroll thumb.
   *
   * #### Notes
   * The payload is the current value of the scroll bar.
   */
  get thumbMoved(): ISignal<this, number> {
    return this._thumbMoved;
  }

  /**
   * A signal emitted when the user clicks a step button.
   *
   * #### Notes
   * The payload is whether a decrease or increase is requested.
   */
  get stepRequested(): ISignal<this, 'decrement' | 'increment'> {
    return this._stepRequested;
  }

  /**
   * A signal emitted when the user clicks the scroll track.
   *
   * #### Notes
   * The payload is whether a decrease or increase is requested.
   */
  get pageRequested(): ISignal<this, 'decrement' | 'increment'> {
    return this._pageRequested;
  }

  /**
   * Get the orientation of the scroll bar.
   */
  get orientation(): ScrollBar.Orientation {
    return this._orientation;
  }

  /**
   * Set the orientation of the scroll bar.
   */
  set orientation(value: ScrollBar.Orientation) {
    // Do nothing if the orientation does not change.
    if (this._orientation === value) {
      return;
    }

    // Release the mouse before making changes.
    this._releaseMouse();

    // Update the internal orientation.
    this._orientation = value;
    this.dataset['orientation'] = value;

    // Schedule an update the scroll bar.
    this.update();
  }

  /**
   * Get the current value of the scroll bar.
   */
  get value(): number {
    return this._value;
  }

  /**
   * Set the current value of the scroll bar.
   *
   * #### Notes
   * The value will be clamped to the range `[0, maximum]`.
   */
  set value(value: number) {
    // Clamp the value to the allowable range.
    value = Math.max(0, Math.min(value, this._maximum));

    // Do nothing if the value does not change.
    if (this._value === value) {
      return;
    }

    // Update the internal value.
    this._value = value;

    // Schedule an update the scroll bar.
    this.update();
  }

  /**
   * Get the page size of the scroll bar.
   *
   * #### Notes
   * The page size is the amount of visible content in the scrolled
   * region, expressed in data units. It determines the size of the
   * scroll bar thumb.
   */
  get page(): number {
    return this._page;
  }

  /**
   * Set the page size of the scroll bar.
   *
   * #### Notes
   * The page size will be clamped to the range `[0, Infinity]`.
   */
  set page(value: number) {
    // Clamp the page size to the allowable range.
    value = Math.max(0, value);

    // Do nothing if the value does not change.
    if (this._page === value) {
      return;
    }

    // Update the internal page size.
    this._page = value;

    // Schedule an update the scroll bar.
    this.update();
  }

  /**
   * Get the maximum value of the scroll bar.
   */
  get maximum(): number {
    return this._maximum;
  }

  /**
   * Set the maximum value of the scroll bar.
   *
   * #### Notes
   * The max size will be clamped to the range `[0, Infinity]`.
   */
  set maximum(value: number) {
    // Clamp the value to the allowable range.
    value = Math.max(0, value);

    // Do nothing if the value does not change.
    if (this._maximum === value) {
      return;
    }

    // Update the internal values.
    this._maximum = value;

    // Clamp the current value to the new range.
    this._value = Math.min(this._value, value);

    // Schedule an update the scroll bar.
    this.update();
  }

  /**
   * The scroll bar decrement button node.
   *
   * #### Notes
   * Modifying this node directly can lead to undefined behavior.
   */
  get decrementNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      'lm-ScrollBar-button'
    )[0] as HTMLDivElement;
  }

  /**
   * The scroll bar increment button node.
   *
   * #### Notes
   * Modifying this node directly can lead to undefined behavior.
   */
  get incrementNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      'lm-ScrollBar-button'
    )[1] as HTMLDivElement;
  }

  /**
   * The scroll bar track node.
   *
   * #### Notes
   * Modifying this node directly can lead to undefined behavior.
   */
  get trackNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      'lm-ScrollBar-track'
    )[0] as HTMLDivElement;
  }

  /**
   * The scroll bar thumb node.
   *
   * #### Notes
   * Modifying this node directly can lead to undefined behavior.
   */
  get thumbNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      'lm-ScrollBar-thumb'
    )[0] as HTMLDivElement;
  }

  /**
   * Handle the DOM events for the scroll bar.
   *
   * @param event - The DOM event sent to the scroll bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the scroll bar's DOM node.
   *
   * This should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'mousedown':
        this._evtMouseDown(event as MouseEvent);
        break;
      case 'mousemove':
        this._evtMouseMove(event as MouseEvent);
        break;
      case 'mouseup':
        this._evtMouseUp(event as MouseEvent);
        break;
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
      case 'contextmenu':
        event.preventDefault();
        event.stopPropagation();
        break;
    }
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
    this._releaseMouse();
  }

  /**
   * A method invoked on an 'update-request' message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Convert the value and page into percentages.
    let value = (this._value * 100) / this._maximum;
    let page = (this._page * 100) / (this._page + this._maximum);

    // Clamp the value and page to the relevant range.
    value = Math.max(0, Math.min(value, 100));
    page = Math.max(0, Math.min(page, 100));

    // Fetch the thumb style.
    let thumbStyle = this.thumbNode.style;

    // Update the thumb style for the current orientation.
    if (this._orientation === 'horizontal') {
      thumbStyle.top = '';
      thumbStyle.height = '';
      thumbStyle.left = `${value}%`;
      thumbStyle.width = `${page}%`;
      thumbStyle.transform = `translate(${-value}%, 0%)`;
    } else {
      thumbStyle.left = '';
      thumbStyle.width = '';
      thumbStyle.top = `${value}%`;
      thumbStyle.height = `${page}%`;
      thumbStyle.transform = `translate(0%, ${-value}%)`;
    }
  }

  /**
   * Handle the `'keydown'` event for the scroll bar.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop all input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Ignore anything except the `Escape` key.
    if (event.keyCode !== 27) {
      return;
    }

    // Fetch the previous scroll value.
    let value = this._pressData ? this._pressData.value : -1;

    // Release the mouse.
    this._releaseMouse();

    // Restore the old scroll value if possible.
    if (value !== -1) {
      this._moveThumb(value);
    }
  }

  /**
   * Handle the `'mousedown'` event for the scroll bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Send an activate request to the scroll bar. This can be
    // used by message hooks to activate something relevant.
    this.activate();

    // Do nothing if the mouse is already captured.
    if (this._pressData) {
      return;
    }

    // Find the pressed scroll bar part.
    let part = Private.findPart(this, event.target as HTMLElement);

    // Do nothing if the part is not of interest.
    if (!part) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Override the mouse cursor.
    let override = Drag.overrideCursor('default');

    // Set up the press data.
    this._pressData = {
      part,
      override,
      delta: -1,
      value: -1,
      mouseX: event.clientX,
      mouseY: event.clientY
    };

    // Add the extra event listeners.
    document.addEventListener('mousemove', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('keydown', this, true);
    document.addEventListener('contextmenu', this, true);

    // Handle a thumb press.
    if (part === 'thumb') {
      // Fetch the thumb node.
      let thumbNode = this.thumbNode;

      // Fetch the client rect for the thumb.
      let thumbRect = thumbNode.getBoundingClientRect();

      // Update the press data delta for the current orientation.
      if (this._orientation === 'horizontal') {
        this._pressData.delta = event.clientX - thumbRect.left;
      } else {
        this._pressData.delta = event.clientY - thumbRect.top;
      }

      // Add the active class to the thumb node.
      thumbNode.classList.add('lm-mod-active');

      // Store the current value in the press data.
      this._pressData.value = this._value;

      // Finished.
      return;
    }

    // Handle a track press.
    if (part === 'track') {
      // Fetch the client rect for the thumb.
      let thumbRect = this.thumbNode.getBoundingClientRect();

      // Determine the direction for the page request.
      let dir: 'decrement' | 'increment';
      if (this._orientation === 'horizontal') {
        dir = event.clientX < thumbRect.left ? 'decrement' : 'increment';
      } else {
        dir = event.clientY < thumbRect.top ? 'decrement' : 'increment';
      }

      // Start the repeat timer.
      this._repeatTimer = window.setTimeout(this._onRepeat, 350);

      // Emit the page requested signal.
      this._pageRequested.emit(dir);

      // Finished.
      return;
    }

    // Handle a decrement button press.
    if (part === 'decrement') {
      // Add the active class to the decrement node.
      this.decrementNode.classList.add('lm-mod-active');

      // Start the repeat timer.
      this._repeatTimer = window.setTimeout(this._onRepeat, 350);

      // Emit the step requested signal.
      this._stepRequested.emit('decrement');

      // Finished.
      return;
    }

    // Handle an increment button press.
    if (part === 'increment') {
      // Add the active class to the increment node.
      this.incrementNode.classList.add('lm-mod-active');

      // Start the repeat timer.
      this._repeatTimer = window.setTimeout(this._onRepeat, 350);

      // Emit the step requested signal.
      this._stepRequested.emit('increment');

      // Finished.
      return;
    }
  }

  /**
   * Handle the `'mousemove'` event for the scroll bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Do nothing if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Update the mouse position.
    this._pressData.mouseX = event.clientX;
    this._pressData.mouseY = event.clientY;

    // Bail if the thumb is not being dragged.
    if (this._pressData.part !== 'thumb') {
      return;
    }

    // Get the client rect for the thumb and track.
    let thumbRect = this.thumbNode.getBoundingClientRect();
    let trackRect = this.trackNode.getBoundingClientRect();

    // Fetch the scroll geometry based on the orientation.
    let trackPos: number;
    let trackSpan: number;
    if (this._orientation === 'horizontal') {
      trackPos = event.clientX - trackRect.left - this._pressData.delta;
      trackSpan = trackRect.width - thumbRect.width;
    } else {
      trackPos = event.clientY - trackRect.top - this._pressData.delta;
      trackSpan = trackRect.height - thumbRect.height;
    }

    // Compute the desired value from the scroll geometry.
    let value = trackSpan === 0 ? 0 : (trackPos * this._maximum) / trackSpan;

    // Move the thumb to the computed value.
    this._moveThumb(value);
  }

  /**
   * Handle the `'mouseup'` event for the scroll bar.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Do nothing if it's not a left mouse release.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse.
    this._releaseMouse();
  }

  /**
   * Release the mouse and restore the node states.
   */
  private _releaseMouse(): void {
    // Bail if there is no press data.
    if (!this._pressData) {
      return;
    }

    // Clear the repeat timer.
    clearTimeout(this._repeatTimer);
    this._repeatTimer = -1;

    // Clear the press data.
    this._pressData.override.dispose();
    this._pressData = null;

    // Remove the extra event listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Remove the active classes from the nodes.
    this.thumbNode.classList.remove('lm-mod-active');
    this.decrementNode.classList.remove('lm-mod-active');
    this.incrementNode.classList.remove('lm-mod-active');
  }

  /**
   * Move the thumb to the specified position.
   */
  private _moveThumb(value: number): void {
    // Clamp the value to the allowed range.
    value = Math.max(0, Math.min(value, this._maximum));

    // Bail if the value does not change.
    if (this._value === value) {
      return;
    }

    // Update the internal value.
    this._value = value;

    // Schedule an update of the scroll bar.
    this.update();

    // Emit the thumb moved signal.
    this._thumbMoved.emit(value);
  }

  /**
   * A timeout callback for repeating the mouse press.
   */
  private _onRepeat = () => {
    // Clear the repeat timer id.
    this._repeatTimer = -1;

    // Bail if the mouse has been released.
    if (!this._pressData) {
      return;
    }

    // Look up the part that was pressed.
    let part = this._pressData.part;

    // Bail if the thumb was pressed.
    if (part === 'thumb') {
      return;
    }

    // Schedule the timer for another repeat.
    this._repeatTimer = window.setTimeout(this._onRepeat, 20);

    // Get the current mouse position.
    let mouseX = this._pressData.mouseX;
    let mouseY = this._pressData.mouseY;

    // Handle a decrement button repeat.
    if (part === 'decrement') {
      // Bail if the mouse is not over the button.
      if (!ElementExt.hitTest(this.decrementNode, mouseX, mouseY)) {
        return;
      }

      // Emit the step requested signal.
      this._stepRequested.emit('decrement');

      // Finished.
      return;
    }

    // Handle an increment button repeat.
    if (part === 'increment') {
      // Bail if the mouse is not over the button.
      if (!ElementExt.hitTest(this.incrementNode, mouseX, mouseY)) {
        return;
      }

      // Emit the step requested signal.
      this._stepRequested.emit('increment');

      // Finished.
      return;
    }

    // Handle a track repeat.
    if (part === 'track') {
      // Bail if the mouse is not over the track.
      if (!ElementExt.hitTest(this.trackNode, mouseX, mouseY)) {
        return;
      }

      // Fetch the thumb node.
      let thumbNode = this.thumbNode;

      // Bail if the mouse is over the thumb.
      if (ElementExt.hitTest(thumbNode, mouseX, mouseY)) {
        return;
      }

      // Fetch the client rect for the thumb.
      let thumbRect = thumbNode.getBoundingClientRect();

      // Determine the direction for the page request.
      let dir: 'decrement' | 'increment';
      if (this._orientation === 'horizontal') {
        dir = mouseX < thumbRect.left ? 'decrement' : 'increment';
      } else {
        dir = mouseY < thumbRect.top ? 'decrement' : 'increment';
      }

      // Emit the page requested signal.
      this._pageRequested.emit(dir);

      // Finished.
      return;
    }
  };

  private _value = 0;
  private _page = 10;
  private _maximum = 100;
  private _repeatTimer = -1;
  private _orientation: ScrollBar.Orientation;
  private _pressData: Private.IPressData | null = null;
  private _thumbMoved = new Signal<this, number>(this);
  private _stepRequested = new Signal<this, 'decrement' | 'increment'>(this);
  private _pageRequested = new Signal<this, 'decrement' | 'increment'>(this);
}

/**
 * The namespace for the `ScrollBar` class statics.
 */
export namespace ScrollBar {
  /**
   * A type alias for a scroll bar orientation.
   */
  export type Orientation = 'horizontal' | 'vertical';

  /**
   * An options object for creating a scroll bar.
   */
  export interface IOptions {
    /**
     * The orientation of the scroll bar.
     *
     * The default is `'vertical'`.
     */
    orientation?: Orientation;

    /**
     * The value for the scroll bar.
     *
     * The default is `0`.
     */
    value?: number;

    /**
     * The page size for the scroll bar.
     *
     * The default is `10`.
     */
    page?: number;

    /**
     * The maximum value for the scroll bar.
     *
     * The default is `100`.
     */
    maximum?: number;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the parts of a scroll bar.
   */
  export type ScrollBarPart = 'thumb' | 'track' | 'decrement' | 'increment';

  /**
   * An object which holds mouse press data.
   */
  export interface IPressData {
    /**
     * The scroll bar part which was pressed.
     */
    part: ScrollBarPart;

    /**
     * The offset of the press in thumb coordinates, or -1.
     */
    delta: number;

    /**
     * The scroll value at the time the thumb was pressed, or -1.
     */
    value: number;

    /**
     * The disposable which will clear the override cursor.
     */
    override: IDisposable;

    /**
     * The current X position of the mouse.
     */
    mouseX: number;

    /**
     * The current Y position of the mouse.
     */
    mouseY: number;
  }

  /**
   * Create the DOM node for a scroll bar.
   */
  export function createNode(): HTMLElement {
    let node = document.createElement('div');
    let decrement = document.createElement('div');
    let increment = document.createElement('div');
    let track = document.createElement('div');
    let thumb = document.createElement('div');
    decrement.className = 'lm-ScrollBar-button';
    increment.className = 'lm-ScrollBar-button';
    decrement.dataset['action'] = 'decrement';
    increment.dataset['action'] = 'increment';
    track.className = 'lm-ScrollBar-track';
    thumb.className = 'lm-ScrollBar-thumb';
    track.appendChild(thumb);
    node.appendChild(decrement);
    node.appendChild(track);
    node.appendChild(increment);
    return node;
  }

  /**
   * Find the scroll bar part which contains the given target.
   */
  export function findPart(
    scrollBar: ScrollBar,
    target: HTMLElement
  ): ScrollBarPart | null {
    // Test the thumb.
    if (scrollBar.thumbNode.contains(target)) {
      return 'thumb';
    }

    // Test the track.
    if (scrollBar.trackNode.contains(target)) {
      return 'track';
    }

    // Test the decrement button.
    if (scrollBar.decrementNode.contains(target)) {
      return 'decrement';
    }

    // Test the increment button.
    if (scrollBar.incrementNode.contains(target)) {
      return 'increment';
    }

    // Indicate no match.
    return null;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { MessageLoop } from '@lumino/messaging';

import { Layout } from './layout';

import { Widget } from './widget';

/**
 * A concrete layout implementation which holds a single widget.
 *
 * #### Notes
 * This class is useful for creating simple container widgets which
 * hold a single child. The child should be positioned with CSS.
 */
export class SingletonLayout extends Layout {
  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    if (this._widget) {
      let widget = this._widget;
      this._widget = null;
      widget.dispose();
    }
    super.dispose();
  }

  /**
   * Get the child widget for the layout.
   */
  get widget(): Widget | null {
    return this._widget;
  }

  /**
   * Set the child widget for the layout.
   *
   * #### Notes
   * Setting the child widget will cause the old child widget to be
   * automatically disposed. If that is not desired, set the parent
   * of the old child to `null` before assigning a new child.
   */
  set widget(widget: Widget | null) {
    // Remove the widget from its current parent. This is a no-op
    // if the widget's parent is already the layout parent widget.
    if (widget) {
      widget.parent = this.parent;
    }

    // Bail early if the widget does not change.
    if (this._widget === widget) {
      return;
    }

    // Dispose of the old child widget.
    if (this._widget) {
      this._widget.dispose();
    }

    // Update the internal widget.
    this._widget = widget;

    // Attach the new child widget if needed.
    if (this.parent && widget) {
      this.attachWidget(widget);
    }
  }

  /**
   * Create an iterator over the widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   */
  *[Symbol.iterator](): IterableIterator<Widget> {
    if (this._widget) {
      yield this._widget;
    }
  }

  /**
   * Remove a widget from the layout.
   *
   * @param widget - The widget to remove from the layout.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method does *not* modify the widget's `parent`.
   */
  removeWidget(widget: Widget): void {
    // Bail early if the widget does not exist in the layout.
    if (this._widget !== widget) {
      return;
    }

    // Clear the internal widget.
    this._widget = null;

    // If the layout is parented, detach the widget from the DOM.
    if (this.parent) {
      this.detachWidget(widget);
    }
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    super.init();
    for (const widget of this) {
      this.attachWidget(widget);
    }
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param index - The current index of the widget in the layout.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This method is called automatically by the single layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation adds the widgets's node to the parent's
   * node at the proper location, and sends the appropriate attach
   * messages to the widget if the parent is attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the widget's
   * node is added to the parent's node.
   */
  protected attachWidget(widget: Widget): void {
    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget's node to the parent.
    this.parent!.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This method is called automatically by the single layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation removes the widget's node from the
   * parent's node, and sends the appropriate detach messages to the
   * widget if the parent is attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the widget's
   * node is removed from the parent's node.
   */
  protected detachWidget(widget: Widget): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }
  }

  private _widget: Widget | null = null;
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { ElementExt } from '@lumino/domutils';

import { Message, MessageLoop } from '@lumino/messaging';

import { AttachedProperty } from '@lumino/properties';

import { BoxEngine, BoxSizer } from './boxengine';

import { LayoutItem } from './layout';

import { PanelLayout } from './panellayout';

import { Utils } from './utils';

import { Widget } from './widget';

/**
 * A layout which arranges its widgets into resizable sections.
 */
export class SplitLayout extends PanelLayout {
  /**
   * Construct a new split layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: SplitLayout.IOptions) {
    super();
    this.renderer = options.renderer;
    if (options.orientation !== undefined) {
      this._orientation = options.orientation;
    }
    if (options.alignment !== undefined) {
      this._alignment = options.alignment;
    }
    if (options.spacing !== undefined) {
      this._spacing = Utils.clampDimension(options.spacing);
    }
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    // Dispose of the layout items.
    for (const item of this._items) {
      item.dispose();
    }

    // Clear the layout state.
    this._box = null;
    this._items.length = 0;
    this._sizers.length = 0;
    this._handles.length = 0;

    // Dispose of the rest of the layout.
    super.dispose();
  }

  /**
   * The renderer used by the split layout.
   */
  readonly renderer: SplitLayout.IRenderer;

  /**
   * Get the layout orientation for the split layout.
   */
  get orientation(): SplitLayout.Orientation {
    return this._orientation;
  }

  /**
   * Set the layout orientation for the split layout.
   */
  set orientation(value: SplitLayout.Orientation) {
    if (this._orientation === value) {
      return;
    }
    this._orientation = value;
    if (!this.parent) {
      return;
    }
    this.parent.dataset['orientation'] = value;
    this.parent.fit();
  }

  /**
   * Get the content alignment for the split layout.
   *
   * #### Notes
   * This is the alignment of the widgets in the layout direction.
   *
   * The alignment has no effect if the widgets can expand  to fill the
   * entire split layout.
   */
  get alignment(): SplitLayout.Alignment {
    return this._alignment;
  }

  /**
   * Set the content alignment for the split layout.
   *
   * #### Notes
   * This is the alignment of the widgets in the layout direction.
   *
   * The alignment has no effect if the widgets can expand  to fill the
   * entire split layout.
   */
  set alignment(value: SplitLayout.Alignment) {
    if (this._alignment === value) {
      return;
    }
    this._alignment = value;
    if (!this.parent) {
      return;
    }
    this.parent.dataset['alignment'] = value;
    this.parent.update();
  }

  /**
   * Get the inter-element spacing for the split layout.
   */
  get spacing(): number {
    return this._spacing;
  }

  /**
   * Set the inter-element spacing for the split layout.
   */
  set spacing(value: number) {
    value = Utils.clampDimension(value);
    if (this._spacing === value) {
      return;
    }
    this._spacing = value;
    if (!this.parent) {
      return;
    }
    this.parent.fit();
  }

  /**
   * A read-only array of the split handles in the layout.
   */
  get handles(): ReadonlyArray<HTMLDivElement> {
    return this._handles;
  }

  /**
   * Get the absolute sizes of the widgets in the layout.
   *
   * @returns A new array of the absolute sizes of the widgets.
   *
   * This method **does not** measure the DOM nodes.
   */
  absoluteSizes(): number[] {
    return this._sizers.map(sizer => sizer.size);
  }

  /**
   * Get the relative sizes of the widgets in the layout.
   *
   * @returns A new array of the relative sizes of the widgets.
   *
   * #### Notes
   * The returned sizes reflect the sizes of the widgets normalized
   * relative to their siblings.
   *
   * This method **does not** measure the DOM nodes.
   */
  relativeSizes(): number[] {
    return Private.normalize(this._sizers.map(sizer => sizer.size));
  }

  /**
   * Set the relative sizes for the widgets in the layout.
   *
   * @param sizes - The relative sizes for the widgets in the panel.
   * @param update - Update the layout after setting relative sizes.
   * Default is True.
   *
   * #### Notes
   * Extra values are ignored, too few will yield an undefined layout.
   *
   * The actual geometry of the DOM nodes is updated asynchronously.
   */
  setRelativeSizes(sizes: number[], update = true): void {
    // Copy the sizes and pad with zeros as needed.
    let n = this._sizers.length;
    let temp = sizes.slice(0, n);
    while (temp.length < n) {
      temp.push(0);
    }

    // Normalize the padded sizes.
    let normed = Private.normalize(temp);

    // Apply the normalized sizes to the sizers.
    for (let i = 0; i < n; ++i) {
      let sizer = this._sizers[i];
      sizer.sizeHint = normed[i];
      sizer.size = normed[i];
    }

    // Set the flag indicating the sizes are normalized.
    this._hasNormedSizes = true;

    // Trigger an update of the parent widget.
    if (update && this.parent) {
      this.parent.update();
    }
  }

  /**
   * Move the offset position of a split handle.
   *
   * @param index - The index of the handle of the interest.
   *
   * @param position - The desired offset position of the handle.
   *
   * #### Notes
   * The position is relative to the offset parent.
   *
   * This will move the handle as close as possible to the desired
   * position. The sibling widgets will be adjusted as necessary.
   */
  moveHandle(index: number, position: number): void {
    // Bail if the index is invalid or the handle is hidden.
    let handle = this._handles[index];
    if (!handle || handle.classList.contains('lm-mod-hidden')) {
      return;
    }

    // Compute the desired delta movement for the handle.
    let delta: number;
    if (this._orientation === 'horizontal') {
      delta = position - handle.offsetLeft;
    } else {
      delta = position - handle.offsetTop;
    }

    // Bail if there is no handle movement.
    if (delta === 0) {
      return;
    }

    // Prevent widget resizing unless needed.
    for (let sizer of this._sizers) {
      if (sizer.size > 0) {
        sizer.sizeHint = sizer.size;
      }
    }

    // Adjust the sizers to reflect the handle movement.
    BoxEngine.adjust(this._sizers, index, delta);

    // Update the layout of the widgets.
    if (this.parent) {
      this.parent.update();
    }
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    this.parent!.dataset['orientation'] = this.orientation;
    this.parent!.dataset['alignment'] = this.alignment;
    super.init();
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param index - The current index of the widget in the layout.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected attachWidget(index: number, widget: Widget): void {
    // Create the item, handle, and sizer for the new widget.
    let item = new LayoutItem(widget);
    let handle = Private.createHandle(this.renderer);
    let average = Private.averageSize(this._sizers);
    let sizer = Private.createSizer(average);

    // Insert the item, handle, and sizer into the internal arrays.
    ArrayExt.insert(this._items, index, item);
    ArrayExt.insert(this._sizers, index, sizer);
    ArrayExt.insert(this._handles, index, handle);

    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget and handle nodes to the parent.
    this.parent!.node.appendChild(widget.node);
    this.parent!.node.appendChild(handle);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * Move a widget in the parent's DOM node.
   *
   * @param fromIndex - The previous index of the widget in the layout.
   *
   * @param toIndex - The current index of the widget in the layout.
   *
   * @param widget - The widget to move in the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    // Move the item, sizer, and handle for the widget.
    ArrayExt.move(this._items, fromIndex, toIndex);
    ArrayExt.move(this._sizers, fromIndex, toIndex);
    ArrayExt.move(this._handles, fromIndex, toIndex);

    // Post a fit request to the parent to show/hide last handle.
    this.parent!.fit();
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param index - The previous index of the widget in the layout.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected detachWidget(index: number, widget: Widget): void {
    // Remove the item, handle, and sizer for the widget.
    let item = ArrayExt.removeAt(this._items, index);
    let handle = ArrayExt.removeAt(this._handles, index);
    ArrayExt.removeAt(this._sizers, index);

    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget and handle nodes from the parent.
    this.parent!.node.removeChild(widget.node);
    this.parent!.node.removeChild(handle!);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }

    // Dispose of the layout item.
    item!.dispose();

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg);
    this.parent!.update();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height);
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1);
    }
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit();
    }
  }

  /**
   * Update the item position.
   *
   * @param i Item index
   * @param isHorizontal Whether the layout is horizontal or not
   * @param left Left position in pixels
   * @param top Top position in pixels
   * @param height Item height
   * @param width Item width
   * @param size Item size
   */
  protected updateItemPosition(
    i: number,
    isHorizontal: boolean,
    left: number,
    top: number,
    height: number,
    width: number,
    size: number
  ): void {
    const item = this._items[i];
    if (item.isHidden) {
      return;
    }

    // Fetch the style for the handle.
    let handleStyle = this._handles[i].style;

    // Update the widget and handle, and advance the relevant edge.
    if (isHorizontal) {
      left += this.widgetOffset;
      item.update(left, top, size, height);
      left += size;
      handleStyle.top = `${top}px`;
      handleStyle.left = `${left}px`;
      handleStyle.width = `${this._spacing}px`;
      handleStyle.height = `${height}px`;
    } else {
      top += this.widgetOffset;
      item.update(left, top, width, size);
      top += size;
      handleStyle.top = `${top}px`;
      handleStyle.left = `${left}px`;
      handleStyle.width = `${width}px`;
      handleStyle.height = `${this._spacing}px`;
    }
  }

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Update the handles and track the visible widget count.
    let nVisible = 0;
    let lastHandleIndex = -1;
    for (let i = 0, n = this._items.length; i < n; ++i) {
      if (this._items[i].isHidden) {
        this._handles[i].classList.add('lm-mod-hidden');
      } else {
        this._handles[i].classList.remove('lm-mod-hidden');
        lastHandleIndex = i;
        nVisible++;
      }
    }

    // Hide the handle for the last visible widget.
    if (lastHandleIndex !== -1) {
      this._handles[lastHandleIndex].classList.add('lm-mod-hidden');
    }

    // Update the fixed space for the visible items.
    this._fixed =
      this._spacing * Math.max(0, nVisible - 1) +
      this.widgetOffset * this._items.length;

    // Setup the computed minimum size.
    let horz = this._orientation === 'horizontal';
    let minW = horz ? this._fixed : 0;
    let minH = horz ? 0 : this._fixed;

    // Update the sizers and computed size limits.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item and corresponding box sizer.
      let item = this._items[i];
      let sizer = this._sizers[i];

      // Prevent resizing unless necessary.
      if (sizer.size > 0) {
        sizer.sizeHint = sizer.size;
      }

      // If the item is hidden, it should consume zero size.
      if (item.isHidden) {
        sizer.minSize = 0;
        sizer.maxSize = 0;
        continue;
      }

      // Update the size limits for the item.
      item.fit();

      // Update the stretch factor.
      sizer.stretch = SplitLayout.getStretch(item.widget);

      // Update the sizer limits and computed min size.
      if (horz) {
        sizer.minSize = item.minWidth;
        sizer.maxSize = item.maxWidth;
        minW += item.minWidth;
        minH = Math.max(minH, item.minHeight);
      } else {
        sizer.minSize = item.minHeight;
        sizer.maxSize = item.maxHeight;
        minH += item.minHeight;
        minW = Math.max(minW, item.minWidth);
      }
    }

    // Update the box sizing and add it to the computed min size.
    let box = (this._box = ElementExt.boxSizing(this.parent!.node));
    minW += box.horizontalSum;
    minH += box.verticalSum;

    // Update the parent's min size constraints.
    let style = this.parent!.node.style;
    style.minWidth = `${minW}px`;
    style.minHeight = `${minH}px`;

    // Set the dirty flag to ensure only a single update occurs.
    this._dirty = true;

    // Notify the ancestor that it should fit immediately. This may
    // cause a resize of the parent, fulfilling the required update.
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest);
    }

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
    }
  }

  /**
   * Update the layout position and size of the widgets.
   *
   * The parent offset dimensions should be `-1` if unknown.
   */
  private _update(offsetWidth: number, offsetHeight: number): void {
    // Clear the dirty flag to indicate the update occurred.
    this._dirty = false;

    // Compute the visible item count.
    let nVisible = 0;
    for (let i = 0, n = this._items.length; i < n; ++i) {
      nVisible += +!this._items[i].isHidden;
    }

    // Bail early if there are no visible items to layout.
    if (nVisible === 0 && this.widgetOffset === 0) {
      return;
    }

    // Measure the parent if the offset dimensions are unknown.
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth;
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight;
    }

    // Ensure the parent box sizing data is computed.
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node);
    }

    // Compute the actual layout bounds adjusted for border and padding.
    let top = this._box.paddingTop;
    let left = this._box.paddingLeft;
    let width = offsetWidth - this._box.horizontalSum;
    let height = offsetHeight - this._box.verticalSum;

    // Set up the variables for justification and alignment offset.
    let extra = 0;
    let offset = 0;
    let horz = this._orientation === 'horizontal';

    if (nVisible > 0) {
      // Compute the adjusted layout space.
      let space: number;
      if (horz) {
        // left += this.widgetOffset;
        space = Math.max(0, width - this._fixed);
      } else {
        // top += this.widgetOffset;
        space = Math.max(0, height - this._fixed);
      }

      // Scale the size hints if they are normalized.
      if (this._hasNormedSizes) {
        for (let sizer of this._sizers) {
          sizer.sizeHint *= space;
        }
        this._hasNormedSizes = false;
      }

      // Distribute the layout space to the box sizers.
      let delta = BoxEngine.calc(this._sizers, space);

      // Account for alignment if there is extra layout space.
      if (delta > 0) {
        switch (this._alignment) {
          case 'start':
            break;
          case 'center':
            extra = 0;
            offset = delta / 2;
            break;
          case 'end':
            extra = 0;
            offset = delta;
            break;
          case 'justify':
            extra = delta / nVisible;
            offset = 0;
            break;
          default:
            throw 'unreachable';
        }
      }
    }

    // Layout the items using the computed box sizes.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item.
      const item = this._items[i];

      // Fetch the computed size for the widget.
      const size = item.isHidden ? 0 : this._sizers[i].size + extra;

      this.updateItemPosition(
        i,
        horz,
        horz ? left + offset : left,
        horz ? top : top + offset,
        height,
        width,
        size
      );

      const fullOffset =
        this.widgetOffset +
        (this._handles[i].classList.contains('lm-mod-hidden')
          ? 0
          : this._spacing);

      if (horz) {
        left += size + fullOffset;
      } else {
        top += size + fullOffset;
      }
    }
  }

  protected widgetOffset = 0;
  private _fixed = 0;
  private _spacing = 4;
  private _dirty = false;
  private _hasNormedSizes = false;
  private _sizers: BoxSizer[] = [];
  private _items: LayoutItem[] = [];
  private _handles: HTMLDivElement[] = [];
  private _box: ElementExt.IBoxSizing | null = null;
  private _alignment: SplitLayout.Alignment = 'start';
  private _orientation: SplitLayout.Orientation = 'horizontal';
}

/**
 * The namespace for the `SplitLayout` class statics.
 */
export namespace SplitLayout {
  /**
   * A type alias for a split layout orientation.
   */
  export type Orientation = 'horizontal' | 'vertical';

  /**
   * A type alias for a split layout alignment.
   */
  export type Alignment = 'start' | 'center' | 'end' | 'justify';

  /**
   * An options object for initializing a split layout.
   */
  export interface IOptions {
    /**
     * The renderer to use for the split layout.
     */
    renderer: IRenderer;

    /**
     * The orientation of the layout.
     *
     * The default is `'horizontal'`.
     */
    orientation?: Orientation;

    /**
     * The content alignment of the layout.
     *
     * The default is `'start'`.
     */
    alignment?: Alignment;

    /**
     * The spacing between items in the layout.
     *
     * The default is `4`.
     */
    spacing?: number;
  }

  /**
   * A renderer for use with a split layout.
   */
  export interface IRenderer {
    /**
     * Create a new handle for use with a split layout.
     *
     * @returns A new handle element.
     */
    createHandle(): HTMLDivElement;
  }

  /**
   * Get the split layout stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The split layout stretch factor for the widget.
   */
  export function getStretch(widget: Widget): number {
    return Private.stretchProperty.get(widget);
  }

  /**
   * Set the split layout stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the stretch factor.
   */
  export function setStretch(widget: Widget, value: number): void {
    Private.stretchProperty.set(widget, value);
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The property descriptor for a widget stretch factor.
   */
  export const stretchProperty = new AttachedProperty<Widget, number>({
    name: 'stretch',
    create: () => 0,
    coerce: (owner, value) => Math.max(0, Math.floor(value)),
    changed: onChildSizingChanged
  });

  /**
   * Create a new box sizer with the given size hint.
   */
  export function createSizer(size: number): BoxSizer {
    let sizer = new BoxSizer();
    sizer.sizeHint = Math.floor(size);
    return sizer;
  }

  /**
   * Create a new split handle node using the given renderer.
   */
  export function createHandle(
    renderer: SplitLayout.IRenderer
  ): HTMLDivElement {
    let handle = renderer.createHandle();
    handle.style.position = 'absolute';
    return handle;
  }

  /**
   * Compute the average size of an array of box sizers.
   */
  export function averageSize(sizers: BoxSizer[]): number {
    return sizers.reduce((v, s) => v + s.size, 0) / sizers.length || 0;
  }

  /**
   * Normalize an array of values.
   */
  export function normalize(values: number[]): number[] {
    let n = values.length;
    if (n === 0) {
      return [];
    }
    let sum = values.reduce((a, b) => a + Math.abs(b), 0);
    return sum === 0 ? values.map(v => 1 / n) : values.map(v => v / sum);
  }

  /**
   * The change handler for the attached sizing properties.
   */
  function onChildSizingChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof SplitLayout) {
      child.parent.fit();
    }
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { IDisposable } from '@lumino/disposable';

import { Drag } from '@lumino/dragdrop';

import { Message } from '@lumino/messaging';

import { ISignal, Signal } from '@lumino/signaling';

import { Panel } from './panel';

import { SplitLayout } from './splitlayout';

import { Widget } from './widget';

/**
 * A panel which arranges its widgets into resizable sections.
 *
 * #### Notes
 * This class provides a convenience wrapper around a [[SplitLayout]].
 */
export class SplitPanel extends Panel {
  /**
   * Construct a new split panel.
   *
   * @param options - The options for initializing the split panel.
   */
  constructor(options: SplitPanel.IOptions = {}) {
    super({ layout: Private.createLayout(options) });
    this.addClass('lm-SplitPanel');
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    this._releaseMouse();
    super.dispose();
  }

  /**
   * Get the layout orientation for the split panel.
   */
  get orientation(): SplitPanel.Orientation {
    return (this.layout as SplitLayout).orientation;
  }

  /**
   * Set the layout orientation for the split panel.
   */
  set orientation(value: SplitPanel.Orientation) {
    (this.layout as SplitLayout).orientation = value;
  }

  /**
   * Get the content alignment for the split panel.
   *
   * #### Notes
   * This is the alignment of the widgets in the layout direction.
   *
   * The alignment has no effect if the widgets can expand to fill the
   * entire split panel.
   */
  get alignment(): SplitPanel.Alignment {
    return (this.layout as SplitLayout).alignment;
  }

  /**
   * Set the content alignment for the split panel.
   *
   * #### Notes
   * This is the alignment of the widgets in the layout direction.
   *
   * The alignment has no effect if the widgets can expand to fill the
   * entire split panel.
   */
  set alignment(value: SplitPanel.Alignment) {
    (this.layout as SplitLayout).alignment = value;
  }

  /**
   * Get the inter-element spacing for the split panel.
   */
  get spacing(): number {
    return (this.layout as SplitLayout).spacing;
  }

  /**
   * Set the inter-element spacing for the split panel.
   */
  set spacing(value: number) {
    (this.layout as SplitLayout).spacing = value;
  }

  /**
   * The renderer used by the split panel.
   */
  get renderer(): SplitPanel.IRenderer {
    return (this.layout as SplitLayout).renderer;
  }

  /**
   * A signal emitted when a split handle has moved.
   */
  get handleMoved(): ISignal<this, void> {
    return this._handleMoved;
  }

  /**
   * A read-only array of the split handles in the panel.
   */
  get handles(): ReadonlyArray<HTMLDivElement> {
    return (this.layout as SplitLayout).handles;
  }

  /**
   * Get the relative sizes of the widgets in the panel.
   *
   * @returns A new array of the relative sizes of the widgets.
   *
   * #### Notes
   * The returned sizes reflect the sizes of the widgets normalized
   * relative to their siblings.
   *
   * This method **does not** measure the DOM nodes.
   */
  relativeSizes(): number[] {
    return (this.layout as SplitLayout).relativeSizes();
  }

  /**
   * Set the relative sizes for the widgets in the panel.
   *
   * @param sizes - The relative sizes for the widgets in the panel.
   * @param update - Update the layout after setting relative sizes.
   * Default is True.
   *
   * #### Notes
   * Extra values are ignored, too few will yield an undefined layout.
   *
   * The actual geometry of the DOM nodes is updated asynchronously.
   */
  setRelativeSizes(sizes: number[], update = true): void {
    (this.layout as SplitLayout).setRelativeSizes(sizes, update);
  }

  /**
   * Handle the DOM events for the split panel.
   *
   * @param event - The DOM event sent to the panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the panel's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'pointerdown':
        this._evtPointerDown(event as PointerEvent);
        break;
      case 'pointermove':
        this._evtPointerMove(event as PointerEvent);
        break;
      case 'pointerup':
        this._evtPointerUp(event as PointerEvent);
        break;
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
      case 'contextmenu':
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('pointerdown', this);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('pointerdown', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: Widget.ChildMessage): void {
    msg.child.addClass('lm-SplitPanel-child');
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    msg.child.removeClass('lm-SplitPanel-child');
    this._releaseMouse();
  }

  /**
   * Handle the `'keydown'` event for the split panel.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop input events during drag.
    if (this._pressData) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) {
      this._releaseMouse();
    }
  }

  /**
   * Handle the `'pointerdown'` event for the split panel.
   */
  private _evtPointerDown(event: PointerEvent): void {
    // Do nothing if the primary button is not pressed.
    if (event.button !== 0) {
      return;
    }

    // Find the handle which contains the target, if any.
    let layout = this.layout as SplitLayout;
    let index = ArrayExt.findFirstIndex(layout.handles, handle => {
      return handle.contains(event.target as HTMLElement);
    });

    // Bail early if the mouse press was not on a handle.
    if (index === -1) {
      return;
    }

    // Stop the event when a split handle is pressed.
    event.preventDefault();
    event.stopPropagation();

    // Add the extra document listeners.
    document.addEventListener('pointerup', this, true);
    document.addEventListener('pointermove', this, true);
    document.addEventListener('keydown', this, true);
    document.addEventListener('contextmenu', this, true);

    // Compute the offset delta for the handle press.
    let delta: number;
    let handle = layout.handles[index];
    let rect = handle.getBoundingClientRect();
    if (layout.orientation === 'horizontal') {
      delta = event.clientX - rect.left;
    } else {
      delta = event.clientY - rect.top;
    }

    // Override the cursor and store the press data.
    let style = window.getComputedStyle(handle);
    let override = Drag.overrideCursor(style.cursor!);
    this._pressData = { index, delta, override };
  }

  /**
   * Handle the `'pointermove'` event for the split panel.
   */
  private _evtPointerMove(event: PointerEvent): void {
    // Stop the event when dragging a split handle.
    event.preventDefault();
    event.stopPropagation();

    // Compute the desired offset position for the handle.
    let pos: number;
    let layout = this.layout as SplitLayout;
    let rect = this.node.getBoundingClientRect();
    if (layout.orientation === 'horizontal') {
      pos = event.clientX - rect.left - this._pressData!.delta;
    } else {
      pos = event.clientY - rect.top - this._pressData!.delta;
    }

    // Move the handle as close to the desired position as possible.
    layout.moveHandle(this._pressData!.index, pos);
  }

  /**
   * Handle the `'pointerup'` event for the split panel.
   */
  private _evtPointerUp(event: PointerEvent): void {
    // Do nothing if the primary button is not released.
    if (event.button !== 0) {
      return;
    }

    // Stop the event when releasing a handle.
    event.preventDefault();
    event.stopPropagation();

    // Finalize the mouse release.
    this._releaseMouse();
  }

  /**
   * Release the mouse grab for the split panel.
   */
  private _releaseMouse(): void {
    // Bail early if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Clear the override cursor.
    this._pressData.override.dispose();
    this._pressData = null;

    // Emit the handle moved signal.
    this._handleMoved.emit();

    // Remove the extra document listeners.
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('pointerup', this, true);
    document.removeEventListener('pointermove', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  private _handleMoved = new Signal<any, void>(this);
  private _pressData: Private.IPressData | null = null;
}

/**
 * The namespace for the `SplitPanel` class statics.
 */
export namespace SplitPanel {
  /**
   * A type alias for a split panel orientation.
   */
  export type Orientation = SplitLayout.Orientation;

  /**
   * A type alias for a split panel alignment.
   */
  export type Alignment = SplitLayout.Alignment;

  /**
   * A type alias for a split panel renderer.
   */
  export type IRenderer = SplitLayout.IRenderer;

  /**
   * An options object for initializing a split panel.
   */
  export interface IOptions {
    /**
     * The renderer to use for the split panel.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;

    /**
     * The layout orientation of the panel.
     *
     * The default is `'horizontal'`.
     */
    orientation?: Orientation;

    /**
     * The content alignment of the panel.
     *
     * The default is `'start'`.
     */
    alignment?: Alignment;

    /**
     * The spacing between items in the panel.
     *
     * The default is `4`.
     */
    spacing?: number;

    /**
     * The split layout to use for the split panel.
     *
     * If this is provided, the other options are ignored.
     *
     * The default is a new `SplitLayout`.
     */
    layout?: SplitLayout;
  }

  /**
   * The default implementation of `IRenderer`.
   */
  export class Renderer implements IRenderer {
    /**
     * Create a new handle for use with a split panel.
     *
     * @returns A new handle element for a split panel.
     */
    createHandle(): HTMLDivElement {
      let handle = document.createElement('div');
      handle.className = 'lm-SplitPanel-handle';
      return handle;
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export const defaultRenderer = new Renderer();

  /**
   * Get the split panel stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The split panel stretch factor for the widget.
   */
  export function getStretch(widget: Widget): number {
    return SplitLayout.getStretch(widget);
  }

  /**
   * Set the split panel stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the stretch factor.
   */
  export function setStretch(widget: Widget, value: number): void {
    SplitLayout.setStretch(widget, value);
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which holds mouse press data.
   */
  export interface IPressData {
    /**
     * The index of the pressed handle.
     */
    index: number;

    /**
     * The offset of the press in handle coordinates.
     */
    delta: number;

    /**
     * The disposable which will clear the override cursor.
     */
    override: IDisposable;
  }

  /**
   * Create a split layout for the given panel options.
   */
  export function createLayout(options: SplitPanel.IOptions): SplitLayout {
    return (
      options.layout ||
      new SplitLayout({
        renderer: options.renderer || SplitPanel.defaultRenderer,
        orientation: options.orientation,
        alignment: options.alignment,
        spacing: options.spacing
      })
    );
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { ElementExt } from '@lumino/domutils';

import { Message, MessageLoop } from '@lumino/messaging';

import { Layout, LayoutItem } from './layout';

import { PanelLayout } from './panellayout';

import { Widget } from './widget';

/**
 * A layout where visible widgets are stacked atop one another.
 *
 * #### Notes
 * The Z-order of the visible widgets follows their layout order.
 */
export class StackedLayout extends PanelLayout {
  constructor(options: StackedLayout.IOptions = {}) {
    super(options);
    this._hiddenMode =
      options.hiddenMode !== undefined
        ? options.hiddenMode
        : Widget.HiddenMode.Display;
  }

  /**
   * The method for hiding widgets.
   *
   * #### Notes
   * If there is only one child widget, `Display` hiding mode will be used
   * regardless of this setting.
   */
  get hiddenMode(): Widget.HiddenMode {
    return this._hiddenMode;
  }

  /**
   * Set the method for hiding widgets.
   *
   * #### Notes
   * If there is only one child widget, `Display` hiding mode will be used
   * regardless of this setting.
   */
  set hiddenMode(v: Widget.HiddenMode) {
    if (this._hiddenMode === v) {
      return;
    }
    this._hiddenMode = v;
    if (this.widgets.length > 1) {
      this.widgets.forEach(w => {
        w.hiddenMode = this._hiddenMode;
      });
    }
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    // Dispose of the layout items.
    for (const item of this._items) {
      item.dispose();
    }

    // Clear the layout state.
    this._box = null;
    this._items.length = 0;

    // Dispose of the rest of the layout.
    super.dispose();
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param index - The current index of the widget in the layout.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected attachWidget(index: number, widget: Widget): void {
    // Using transform create an additional layer in the pixel pipeline
    // to limit the number of layer, it is set only if there is more than one widget.
    if (
      this._hiddenMode === Widget.HiddenMode.Scale &&
      this._items.length > 0
    ) {
      if (this._items.length === 1) {
        this.widgets[0].hiddenMode = Widget.HiddenMode.Scale;
      }
      widget.hiddenMode = Widget.HiddenMode.Scale;
    } else {
      widget.hiddenMode = Widget.HiddenMode.Display;
    }

    // Create and add a new layout item for the widget.
    ArrayExt.insert(this._items, index, new LayoutItem(widget));

    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget's node to the parent.
    this.parent!.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * Move a widget in the parent's DOM node.
   *
   * @param fromIndex - The previous index of the widget in the layout.
   *
   * @param toIndex - The current index of the widget in the layout.
   *
   * @param widget - The widget to move in the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected moveWidget(
    fromIndex: number,
    toIndex: number,
    widget: Widget
  ): void {
    // Move the layout item for the widget.
    ArrayExt.move(this._items, fromIndex, toIndex);

    // Post an update request for the parent widget.
    this.parent!.update();
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param index - The previous index of the widget in the layout.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected detachWidget(index: number, widget: Widget): void {
    // Remove the layout item for the widget.
    let item = ArrayExt.removeAt(this._items, index);

    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }

    // Reset the z-index for the widget.
    item!.widget.node.style.zIndex = '';

    // Reset the hidden mode for the widget.
    if (this._hiddenMode === Widget.HiddenMode.Scale) {
      widget.hiddenMode = Widget.HiddenMode.Display;

      // Reset the hidden mode for the first widget if necessary.
      if (this._items.length === 1) {
        this._items[0].widget.hiddenMode = Widget.HiddenMode.Display;
      }
    }

    // Dispose of the layout item.
    item!.dispose();

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg);
    this.parent!.update();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height);
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1);
    }
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit();
    }
  }

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Set up the computed minimum size.
    let minW = 0;
    let minH = 0;

    // Update the computed minimum size.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item.
      let item = this._items[i];

      // Ignore hidden items.
      if (item.isHidden) {
        continue;
      }

      // Update the size limits for the item.
      item.fit();

      // Update the computed minimum size.
      minW = Math.max(minW, item.minWidth);
      minH = Math.max(minH, item.minHeight);
    }

    // Update the box sizing and add it to the computed min size.
    let box = (this._box = ElementExt.boxSizing(this.parent!.node));
    minW += box.horizontalSum;
    minH += box.verticalSum;

    // Update the parent's min size constraints.
    let style = this.parent!.node.style;
    style.minWidth = `${minW}px`;
    style.minHeight = `${minH}px`;

    // Set the dirty flag to ensure only a single update occurs.
    this._dirty = true;

    // Notify the ancestor that it should fit immediately. This may
    // cause a resize of the parent, fulfilling the required update.
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest);
    }

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
    }
  }

  /**
   * Update the layout position and size of the widgets.
   *
   * The parent offset dimensions should be `-1` if unknown.
   */
  private _update(offsetWidth: number, offsetHeight: number): void {
    // Clear the dirty flag to indicate the update occurred.
    this._dirty = false;

    // Compute the visible item count.
    let nVisible = 0;
    for (let i = 0, n = this._items.length; i < n; ++i) {
      nVisible += +!this._items[i].isHidden;
    }

    // Bail early if there are no visible items to layout.
    if (nVisible === 0) {
      return;
    }

    // Measure the parent if the offset dimensions are unknown.
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth;
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight;
    }

    // Ensure the parent box sizing data is computed.
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node);
    }

    // Compute the actual layout bounds adjusted for border and padding.
    let top = this._box.paddingTop;
    let left = this._box.paddingLeft;
    let width = offsetWidth - this._box.horizontalSum;
    let height = offsetHeight - this._box.verticalSum;

    // Update the widget stacking order and layout geometry.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item.
      let item = this._items[i];

      // Ignore hidden items.
      if (item.isHidden) {
        continue;
      }

      // Set the z-index for the widget.
      item.widget.node.style.zIndex = `${i}`;

      // Update the item geometry.
      item.update(left, top, width, height);
    }
  }

  private _dirty = false;
  private _items: LayoutItem[] = [];
  private _box: ElementExt.IBoxSizing | null = null;
  private _hiddenMode: Widget.HiddenMode;
}

/**
 * The namespace for the `StackedLayout` class statics.
 */
export namespace StackedLayout {
  /**
   * An options object for initializing a stacked layout.
   */
  export interface IOptions extends Layout.IOptions {
    /**
     * The method for hiding widgets.
     *
     * The default is `Widget.HiddenMode.Display`.
     */
    hiddenMode?: Widget.HiddenMode;
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ISignal, Signal } from '@lumino/signaling';

import { Panel } from './panel';

import { StackedLayout } from './stackedlayout';

import { Widget } from './widget';

/**
 * A panel where visible widgets are stacked atop one another.
 *
 * #### Notes
 * This class provides a convenience wrapper around a [[StackedLayout]].
 */
export class StackedPanel extends Panel {
  /**
   * Construct a new stacked panel.
   *
   * @param options - The options for initializing the panel.
   */
  constructor(options: StackedPanel.IOptions = {}) {
    super({ layout: Private.createLayout(options) });
    this.addClass('lm-StackedPanel');
  }

  /**
   * The method for hiding widgets.
   *
   * #### Notes
   * If there is only one child widget, `Display` hiding mode will be used
   * regardless of this setting.
   */
  get hiddenMode(): Widget.HiddenMode {
    return (this.layout as StackedLayout).hiddenMode;
  }

  /**
   * Set the method for hiding widgets.
   *
   * #### Notes
   * If there is only one child widget, `Display` hiding mode will be used
   * regardless of this setting.
   */
  set hiddenMode(v: Widget.HiddenMode) {
    (this.layout as StackedLayout).hiddenMode = v;
  }

  /**
   * A signal emitted when a widget is removed from a stacked panel.
   */
  get widgetRemoved(): ISignal<this, Widget> {
    return this._widgetRemoved;
  }

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: Widget.ChildMessage): void {
    msg.child.addClass('lm-StackedPanel-child');
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    msg.child.removeClass('lm-StackedPanel-child');
    this._widgetRemoved.emit(msg.child);
  }

  private _widgetRemoved = new Signal<this, Widget>(this);
}

/**
 * The namespace for the `StackedPanel` class statics.
 */
export namespace StackedPanel {
  /**
   * An options object for creating a stacked panel.
   */
  export interface IOptions {
    /**
     * The stacked layout to use for the stacked panel.
     *
     * The default is a new `StackedLayout`.
     */
    layout?: StackedLayout;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create a stacked layout for the given panel options.
   */
  export function createLayout(options: StackedPanel.IOptions): StackedLayout {
    return options.layout || new StackedLayout();
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { ArrayExt } from '@lumino/algorithm';

import { IDisposable } from '@lumino/disposable';

import { ElementExt } from '@lumino/domutils';

import { Drag } from '@lumino/dragdrop';

import { Message, MessageLoop } from '@lumino/messaging';

import { ISignal, Signal } from '@lumino/signaling';

import {
  ElementARIAAttrs,
  ElementDataset,
  ElementInlineStyle,
  h,
  VirtualDOM,
  VirtualElement
} from '@lumino/virtualdom';

import { Title } from './title';

import { Widget } from './widget';

/**
 * A widget which displays titles as a single row or column of tabs.
 *
 * #### Notes
 * If CSS transforms are used to rotate nodes for vertically oriented
 * text, then tab dragging will not work correctly. The `tabsMovable`
 * property should be set to `false` when rotating nodes from CSS.
 */
export class TabBar<T> extends Widget {
  /**
   * Construct a new tab bar.
   *
   * @param options - The options for initializing the tab bar.
   */
  constructor(options: TabBar.IOptions<T> = {}) {
    super({ node: Private.createNode() });
    this.addClass('lm-TabBar');
    this.contentNode.setAttribute('role', 'tablist');
    this.setFlag(Widget.Flag.DisallowLayout);
    this._document = options.document || document;
    this.tabsMovable = options.tabsMovable || false;
    this.titlesEditable = options.titlesEditable || false;
    this.allowDeselect = options.allowDeselect || false;
    this.addButtonEnabled = options.addButtonEnabled || false;
    this.insertBehavior = options.insertBehavior || 'select-tab-if-needed';
    this.name = options.name || '';
    this.orientation = options.orientation || 'horizontal';
    this.removeBehavior = options.removeBehavior || 'select-tab-after';
    this.renderer = options.renderer || TabBar.defaultRenderer;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._releaseMouse();
    this._titles.length = 0;
    this._previousTitle = null;
    super.dispose();
  }

  /**
   * A signal emitted when the current tab is changed.
   *
   * #### Notes
   * This signal is emitted when the currently selected tab is changed
   * either through user or programmatic interaction.
   *
   * Notably, this signal is not emitted when the index of the current
   * tab changes due to tabs being inserted, removed, or moved. It is
   * only emitted when the actual current tab node is changed.
   */
  get currentChanged(): ISignal<this, TabBar.ICurrentChangedArgs<T>> {
    return this._currentChanged;
  }

  /**
   * A signal emitted when a tab is moved by the user.
   *
   * #### Notes
   * This signal is emitted when a tab is moved by user interaction.
   *
   * This signal is not emitted when a tab is moved programmatically.
   */
  get tabMoved(): ISignal<this, TabBar.ITabMovedArgs<T>> {
    return this._tabMoved;
  }

  /**
   * A signal emitted when a tab is clicked by the user.
   *
   * #### Notes
   * If the clicked tab is not the current tab, the clicked tab will be
   * made current and the `currentChanged` signal will be emitted first.
   *
   * This signal is emitted even if the clicked tab is the current tab.
   */
  get tabActivateRequested(): ISignal<
    this,
    TabBar.ITabActivateRequestedArgs<T>
  > {
    return this._tabActivateRequested;
  }

  /**
   * A signal emitted when the tab bar add button is clicked.
   */
  get addRequested(): ISignal<this, void> {
    return this._addRequested;
  }

  /**
   * A signal emitted when a tab close icon is clicked.
   *
   * #### Notes
   * This signal is not emitted unless the tab title is `closable`.
   */
  get tabCloseRequested(): ISignal<this, TabBar.ITabCloseRequestedArgs<T>> {
    return this._tabCloseRequested;
  }

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   *
   * #### Notes
   * This signal is emitted when the user drags a tab with the mouse,
   * and mouse is dragged beyond the detach threshold.
   *
   * The consumer of the signal should call `releaseMouse` and remove
   * the tab in order to complete the detach.
   *
   * This signal is only emitted once per drag cycle.
   */
  get tabDetachRequested(): ISignal<this, TabBar.ITabDetachRequestedArgs<T>> {
    return this._tabDetachRequested;
  }

  /**
   * The renderer used by the tab bar.
   */
  readonly renderer: TabBar.IRenderer<T>;

  /**
   * The document to use with the tab bar.
   *
   * The default is the global `document` instance.
   */
  get document(): Document | ShadowRoot {
    return this._document;
  }

  /**
   * Whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can always be moved programmatically.
   */
  tabsMovable: boolean;

  /**
   * Whether the titles can be user-edited.
   *
   */
  get titlesEditable(): boolean {
    return this._titlesEditable;
  }

  /**
   * Set whether titles can be user edited.
   *
   */
  set titlesEditable(value: boolean) {
    this._titlesEditable = value;
  }

  /**
   * Whether a tab can be deselected by the user.
   *
   * #### Notes
   * Tabs can be always be deselected programmatically.
   */
  allowDeselect: boolean;

  /**
   * The selection behavior when inserting a tab.
   */
  insertBehavior: TabBar.InsertBehavior;

  /**
   * The selection behavior when removing a tab.
   */
  removeBehavior: TabBar.RemoveBehavior;

  /**
   * Get the currently selected title.
   *
   * #### Notes
   * This will be `null` if no tab is selected.
   */
  get currentTitle(): Title<T> | null {
    return this._titles[this._currentIndex] || null;
  }

  /**
   * Set the currently selected title.
   *
   * #### Notes
   * If the title does not exist, the title will be set to `null`.
   */
  set currentTitle(value: Title<T> | null) {
    this.currentIndex = value ? this._titles.indexOf(value) : -1;
  }

  /**
   * Get the index of the currently selected tab.
   *
   * #### Notes
   * This will be `-1` if no tab is selected.
   */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /**
   * Set the index of the currently selected tab.
   *
   * #### Notes
   * If the value is out of range, the index will be set to `-1`.
   */
  set currentIndex(value: number) {
    // Adjust for an out of range index.
    if (value < 0 || value >= this._titles.length) {
      value = -1;
    }

    // Bail early if the index will not change.
    if (this._currentIndex === value) {
      return;
    }

    // Look up the previous index and title.
    let pi = this._currentIndex;
    let pt = this._titles[pi] || null;

    // Look up the current index and title.
    let ci = value;
    let ct = this._titles[ci] || null;

    // Update the current index and previous title.
    this._currentIndex = ci;
    this._previousTitle = pt;

    // Schedule an update of the tabs.
    this.update();

    // Emit the current changed signal.
    this._currentChanged.emit({
      previousIndex: pi,
      previousTitle: pt,
      currentIndex: ci,
      currentTitle: ct
    });
  }

  /**
   * Get the name of the tab bar.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Set the name of the tab bar.
   */
  set name(value: string) {
    this._name = value;
    if (value) {
      this.contentNode.setAttribute('aria-label', value);
    } else {
      this.contentNode.removeAttribute('aria-label');
    }
  }

  /**
   * Get the orientation of the tab bar.
   *
   * #### Notes
   * This controls whether the tabs are arranged in a row or column.
   */
  get orientation(): TabBar.Orientation {
    return this._orientation;
  }

  /**
   * Set the orientation of the tab bar.
   *
   * #### Notes
   * This controls whether the tabs are arranged in a row or column.
   */
  set orientation(value: TabBar.Orientation) {
    // Do nothing if the orientation does not change.
    if (this._orientation === value) {
      return;
    }

    // Release the mouse before making any changes.
    this._releaseMouse();

    // Toggle the orientation values.
    this._orientation = value;
    this.dataset['orientation'] = value;
    this.contentNode.setAttribute('aria-orientation', value);
  }

  /**
   * Whether the add button is enabled.
   */
  get addButtonEnabled(): boolean {
    return this._addButtonEnabled;
  }

  /**
   * Set whether the add button is enabled.
   */
  set addButtonEnabled(value: boolean) {
    // Do nothing if the value does not change.
    if (this._addButtonEnabled === value) {
      return;
    }

    this._addButtonEnabled = value;
    if (value) {
      this.addButtonNode.classList.remove('lm-mod-hidden');
    } else {
      this.addButtonNode.classList.add('lm-mod-hidden');
    }
  }

  /**
   * A read-only array of the titles in the tab bar.
   */
  get titles(): ReadonlyArray<Title<T>> {
    return this._titles;
  }

  /**
   * The tab bar content node.
   *
   * #### Notes
   * This is the node which holds the tab nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(
      'lm-TabBar-content'
    )[0] as HTMLUListElement;
  }

  /**
   * The tab bar add button node.
   *
   * #### Notes
   * This is the node which holds the add button.
   *
   * Modifying this node directly can lead to undefined behavior.
   */
  get addButtonNode(): HTMLDivElement {
    return this.node.getElementsByClassName(
      'lm-TabBar-addButton'
    )[0] as HTMLDivElement;
  }

  /**
   * Add a tab to the end of the tab bar.
   *
   * @param value - The title which holds the data for the tab,
   *   or an options object to convert to a title.
   *
   * @returns The title object added to the tab bar.
   *
   * #### Notes
   * If the title is already added to the tab bar, it will be moved.
   */
  addTab(value: Title<T> | Title.IOptions<T>): Title<T> {
    return this.insertTab(this._titles.length, value);
  }

  /**
   * Insert a tab into the tab bar at the specified index.
   *
   * @param index - The index at which to insert the tab.
   *
   * @param value - The title which holds the data for the tab,
   *   or an options object to convert to a title.
   *
   * @returns The title object added to the tab bar.
   *
   * #### Notes
   * The index will be clamped to the bounds of the tabs.
   *
   * If the title is already added to the tab bar, it will be moved.
   */
  insertTab(index: number, value: Title<T> | Title.IOptions<T>): Title<T> {
    // Release the mouse before making any changes.
    this._releaseMouse();

    // Coerce the value to a title.
    let title = Private.asTitle(value);

    // Look up the index of the title.
    let i = this._titles.indexOf(title);

    // Clamp the insert index to the array bounds.
    let j = Math.max(0, Math.min(index, this._titles.length));

    // If the title is not in the array, insert it.
    if (i === -1) {
      // Insert the title into the array.
      ArrayExt.insert(this._titles, j, title);

      // Connect to the title changed signal.
      title.changed.connect(this._onTitleChanged, this);

      // Schedule an update of the tabs.
      this.update();

      // Adjust the current index for the insert.
      this._adjustCurrentForInsert(j, title);

      // Return the title added to the tab bar.
      return title;
    }

    // Otherwise, the title exists in the array and should be moved.

    // Adjust the index if the location is at the end of the array.
    if (j === this._titles.length) {
      j--;
    }

    // Bail if there is no effective move.
    if (i === j) {
      return title;
    }

    // Move the title to the new location.
    ArrayExt.move(this._titles, i, j);

    // Schedule an update of the tabs.
    this.update();

    // Adjust the current index for the move.
    this._adjustCurrentForMove(i, j);

    // Return the title added to the tab bar.
    return title;
  }

  /**
   * Remove a tab from the tab bar.
   *
   * @param title - The title for the tab to remove.
   *
   * #### Notes
   * This is a no-op if the title is not in the tab bar.
   */
  removeTab(title: Title<T>): void {
    this.removeTabAt(this._titles.indexOf(title));
  }

  /**
   * Remove the tab at a given index from the tab bar.
   *
   * @param index - The index of the tab to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeTabAt(index: number): void {
    // Release the mouse before making any changes.
    this._releaseMouse();

    // Remove the title from the array.
    let title = ArrayExt.removeAt(this._titles, index);

    // Bail if the index is out of range.
    if (!title) {
      return;
    }

    // Disconnect from the title changed signal.
    title.changed.disconnect(this._onTitleChanged, this);

    // Clear the previous title if it's being removed.
    if (title === this._previousTitle) {
      this._previousTitle = null;
    }

    // Schedule an update of the tabs.
    this.update();

    // Adjust the current index for the remove.
    this._adjustCurrentForRemove(index, title);
  }

  /**
   * Remove all tabs from the tab bar.
   */
  clearTabs(): void {
    // Bail if there is nothing to remove.
    if (this._titles.length === 0) {
      return;
    }

    // Release the mouse before making any changes.
    this._releaseMouse();

    // Disconnect from the title changed signals.
    for (let title of this._titles) {
      title.changed.disconnect(this._onTitleChanged, this);
    }

    // Get the current index and title.
    let pi = this.currentIndex;
    let pt = this.currentTitle;

    // Reset the current index and previous title.
    this._currentIndex = -1;
    this._previousTitle = null;

    // Clear the title array.
    this._titles.length = 0;

    // Schedule an update of the tabs.
    this.update();

    // If no tab was selected, there's nothing else to do.
    if (pi === -1) {
      return;
    }

    // Emit the current changed signal.
    this._currentChanged.emit({
      previousIndex: pi,
      previousTitle: pt,
      currentIndex: -1,
      currentTitle: null
    });
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   *
   * #### Notes
   * This will cause the tab bar to stop handling mouse events and to
   * restore the tabs to their non-dragged positions.
   */
  releaseMouse(): void {
    this._releaseMouse();
  }

  /**
   * Handle the DOM events for the tab bar.
   *
   * @param event - The DOM event sent to the tab bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tab bar's DOM node.
   *
   * This should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'pointerdown':
        this._evtPointerDown(event as PointerEvent);
        break;
      case 'pointermove':
        this._evtPointerMove(event as PointerEvent);
        break;
      case 'pointerup':
        this._evtPointerUp(event as PointerEvent);
        break;
      case 'dblclick':
        this._evtDblClick(event as MouseEvent);
        break;
      case 'keydown':
        this._evtKeyDown(event as KeyboardEvent);
        break;
      case 'contextmenu':
        event.preventDefault();
        event.stopPropagation();
        break;
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('pointerdown', this);
    this.node.addEventListener('dblclick', this);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('pointerdown', this);
    this.node.removeEventListener('dblclick', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    let titles = this._titles;
    let renderer = this.renderer;
    let currentTitle = this.currentTitle;
    let content = new Array<VirtualElement>(titles.length);
    for (let i = 0, n = titles.length; i < n; ++i) {
      let title = titles[i];
      let current = title === currentTitle;
      let zIndex = current ? n : n - i - 1;
      content[i] = renderer.renderTab({ title, current, zIndex });
    }
    VirtualDOM.render(content, this.contentNode);
  }

  /**
   * Handle the `'dblclick'` event for the tab bar.
   */
  private _evtDblClick(event: MouseEvent): void {
    // Do nothing if titles are not editable
    if (!this.titlesEditable) {
      return;
    }

    let tabs = this.contentNode.children;

    // Find the index of the released tab.
    let index = ArrayExt.findFirstIndex(tabs, tab => {
      return ElementExt.hitTest(tab, event.clientX, event.clientY);
    });

    // Do nothing if the press is not on a tab.
    if (index === -1) {
      return;
    }

    let title = this.titles[index];
    let label = tabs[index].querySelector('.lm-TabBar-tabLabel') as HTMLElement;
    if (label && label.contains(event.target as HTMLElement)) {
      let value = title.label || '';

      // Clear the label element
      let oldValue = label.innerHTML;
      label.innerHTML = '';

      let input = document.createElement('input');
      input.classList.add('lm-TabBar-tabInput');
      input.value = value;
      label.appendChild(input);

      let onblur = () => {
        input.removeEventListener('blur', onblur);
        label.innerHTML = oldValue;
      };

      input.addEventListener('dblclick', (event: Event) =>
        event.stopPropagation()
      );
      input.addEventListener('blur', onblur);
      input.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          if (input.value !== '') {
            title.label = title.caption = input.value;
          }
          onblur();
        } else if (event.key === 'Escape') {
          onblur();
        }
      });
      input.select();
      input.focus();

      if (label.children.length > 0) {
        (label.children[0] as HTMLElement).focus();
      }
    }
  }

  /**
   * Handle the `'keydown'` event for the tab bar.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop all input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) {
      this._releaseMouse();
    }
  }

  /**
   * Handle the `'pointerdown'` event for the tab bar.
   */
  private _evtPointerDown(event: PointerEvent | MouseEvent): void {
    // Do nothing if it's not a left or middle mouse press.
    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    // Do nothing if a drag is in progress.
    if (this._dragData) {
      return;
    }

    // Check if the add button was clicked.
    let addButtonClicked =
      this.addButtonEnabled &&
      this.addButtonNode.contains(event.target as HTMLElement);

    // Lookup the tab nodes.
    let tabs = this.contentNode.children;

    // Find the index of the pressed tab.
    let index = ArrayExt.findFirstIndex(tabs, tab => {
      return ElementExt.hitTest(tab, event.clientX, event.clientY);
    });

    // Do nothing if the press is not on a tab or the add button.
    if (index === -1 && !addButtonClicked) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Initialize the non-measured parts of the drag data.
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
      detachRequested: false
    };

    // Add the document pointer up listener.
    this.document.addEventListener('pointerup', this, true);

    // Do nothing else if the middle button or add button is clicked.
    if (event.button === 1 || addButtonClicked) {
      return;
    }

    // Do nothing else if the close icon is clicked.
    let icon = tabs[index].querySelector(this.renderer.closeIconSelector);
    if (icon && icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Add the extra listeners if the tabs are movable.
    if (this.tabsMovable) {
      this.document.addEventListener('pointermove', this, true);
      this.document.addEventListener('keydown', this, true);
      this.document.addEventListener('contextmenu', this, true);
    }

    // Update the current index as appropriate.
    if (this.allowDeselect && this.currentIndex === index) {
      this.currentIndex = -1;
    } else {
      this.currentIndex = index;
    }

    // Do nothing else if there is no current tab.
    if (this.currentIndex === -1) {
      return;
    }

    // Emit the tab activate request signal.
    this._tabActivateRequested.emit({
      index: this.currentIndex,
      title: this.currentTitle!
    });
  }

  /**
   * Handle the `'pointermove'` event for the tab bar.
   */
  private _evtPointerMove(event: PointerEvent | MouseEvent): void {
    // Do nothing if no drag is in progress.
    let data = this._dragData;
    if (!data) {
      return;
    }

    // Suppress the event during a drag.
    event.preventDefault();
    event.stopPropagation();

    // Lookup the tab nodes.
    let tabs = this.contentNode.children;

    // Bail early if the drag threshold has not been met.
    if (!data.dragActive && !Private.dragExceeded(data, event)) {
      return;
    }

    // Activate the drag if necessary.
    if (!data.dragActive) {
      // Fill in the rest of the drag data measurements.
      let tabRect = data.tab.getBoundingClientRect();
      if (this._orientation === 'horizontal') {
        data.tabPos = data.tab.offsetLeft;
        data.tabSize = tabRect.width;
        data.tabPressPos = data.pressX - tabRect.left;
      } else {
        data.tabPos = data.tab.offsetTop;
        data.tabSize = tabRect.height;
        data.tabPressPos = data.pressY - tabRect.top;
      }
      data.tabLayout = Private.snapTabLayout(tabs, this._orientation);
      data.contentRect = this.contentNode.getBoundingClientRect();
      data.override = Drag.overrideCursor('default');

      // Add the dragging style classes.
      data.tab.classList.add('lm-mod-dragging');
      this.addClass('lm-mod-dragging');

      // Mark the drag as active.
      data.dragActive = true;
    }

    // Emit the detach requested signal if the threshold is exceeded.
    if (!data.detachRequested && Private.detachExceeded(data, event)) {
      // Only emit the signal once per drag cycle.
      data.detachRequested = true;

      // Setup the arguments for the signal.
      let index = data.index;
      let clientX = event.clientX;
      let clientY = event.clientY;
      let tab = tabs[index] as HTMLElement;
      let title = this._titles[index];

      // Emit the tab detach requested signal.
      this._tabDetachRequested.emit({ index, title, tab, clientX, clientY });

      // Bail if the signal handler aborted the drag.
      if (data.dragAborted) {
        return;
      }
    }

    // Update the positions of the tabs.
    Private.layoutTabs(tabs, data, event, this._orientation);
  }

  /**
   * Handle the `'pointerup'` event for the document.
   */
  private _evtPointerUp(event: PointerEvent | MouseEvent): void {
    // Do nothing if it's not a left or middle mouse release.
    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    // Do nothing if no drag is in progress.
    const data = this._dragData;
    if (!data) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Remove the extra mouse event listeners.
    this.document.removeEventListener('pointermove', this, true);
    this.document.removeEventListener('pointerup', this, true);
    this.document.removeEventListener('keydown', this, true);
    this.document.removeEventListener('contextmenu', this, true);

    // Handle a release when the drag is not active.
    if (!data.dragActive) {
      // Clear the drag data.
      this._dragData = null;

      // Handle clicking the add button.
      let addButtonClicked =
        this.addButtonEnabled &&
        this.addButtonNode.contains(event.target as HTMLElement);
      if (addButtonClicked) {
        this._addRequested.emit(undefined);
        return;
      }

      // Lookup the tab nodes.
      let tabs = this.contentNode.children;

      // Find the index of the released tab.
      let index = ArrayExt.findFirstIndex(tabs, tab => {
        return ElementExt.hitTest(tab, event.clientX, event.clientY);
      });

      // Do nothing if the release is not on the original pressed tab.
      if (index !== data.index) {
        return;
      }

      // Ignore the release if the title is not closable.
      let title = this._titles[index];
      if (!title.closable) {
        return;
      }

      // Emit the close requested signal if the middle button is released.
      if (event.button === 1) {
        this._tabCloseRequested.emit({ index, title });
        return;
      }

      // Emit the close requested signal if the close icon was released.
      let icon = tabs[index].querySelector(this.renderer.closeIconSelector);
      if (icon && icon.contains(event.target as HTMLElement)) {
        this._tabCloseRequested.emit({ index, title });
        return;
      }

      // Otherwise, there is nothing left to do.
      return;
    }

    // Do nothing if the left button is not released.
    if (event.button !== 0) {
      return;
    }

    // Position the tab at its final resting position.
    Private.finalizeTabPosition(data, this._orientation);

    // Remove the dragging class from the tab so it can be transitioned.
    data.tab.classList.remove('lm-mod-dragging');

    // Parse the transition duration for releasing the tab.
    let duration = Private.parseTransitionDuration(data.tab);

    // Complete the release on a timer to allow the tab to transition.
    setTimeout(() => {
      // Do nothing if the drag has been aborted.
      if (data.dragAborted) {
        return;
      }

      // Clear the drag data reference.
      this._dragData = null;

      // Reset the positions of the tabs.
      Private.resetTabPositions(this.contentNode.children, this._orientation);

      // Clear the cursor grab.
      data.override!.dispose();

      // Remove the remaining dragging style.
      this.removeClass('lm-mod-dragging');

      // If the tab was not moved, there is nothing else to do.
      let i = data.index;
      let j = data.targetIndex;
      if (j === -1 || i === j) {
        return;
      }

      // Move the title to the new locations.
      ArrayExt.move(this._titles, i, j);

      // Adjust the current index for the move.
      this._adjustCurrentForMove(i, j);

      // Emit the tab moved signal.
      this._tabMoved.emit({
        fromIndex: i,
        toIndex: j,
        title: this._titles[j]
      });

      // Update the tabs immediately to prevent flicker.
      MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);
    }, duration);
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   */
  private _releaseMouse(): void {
    // Do nothing if no drag is in progress.
    let data = this._dragData;
    if (!data) {
      return;
    }

    // Clear the drag data reference.
    this._dragData = null;

    // Remove the extra document event listeners.
    this.document.removeEventListener('pointermove', this, true);
    this.document.removeEventListener('pointerup', this, true);
    this.document.removeEventListener('keydown', this, true);
    this.document.removeEventListener('contextmenu', this, true);

    // Indicate the drag has been aborted. This allows the mouse
    // event handlers to return early when the drag is canceled.
    data.dragAborted = true;

    // If the drag is not active, there's nothing more to do.
    if (!data.dragActive) {
      return;
    }

    // Reset the tabs to their non-dragged positions.
    Private.resetTabPositions(this.contentNode.children, this._orientation);

    // Clear the cursor override.
    data.override!.dispose();

    // Clear the dragging style classes.
    data.tab.classList.remove('lm-mod-dragging');
    this.removeClass('lm-mod-dragging');
  }

  /**
   * Adjust the current index for a tab insert operation.
   *
   * This method accounts for the tab bar's insertion behavior when
   * adjusting the current index and emitting the changed signal.
   */
  private _adjustCurrentForInsert(i: number, title: Title<T>): void {
    // Lookup commonly used variables.
    let ct = this.currentTitle;
    let ci = this._currentIndex;
    let bh = this.insertBehavior;

    // TODO: do we need to do an update to update the aria-selected attribute?

    // Handle the behavior where the new tab is always selected,
    // or the behavior where the new tab is selected if needed.
    if (bh === 'select-tab' || (bh === 'select-tab-if-needed' && ci === -1)) {
      this._currentIndex = i;
      this._previousTitle = ct;
      this._currentChanged.emit({
        previousIndex: ci,
        previousTitle: ct,
        currentIndex: i,
        currentTitle: title
      });
      return;
    }

    // Otherwise, silently adjust the current index if needed.
    if (ci >= i) {
      this._currentIndex++;
    }
  }

  /**
   * Adjust the current index for a tab move operation.
   *
   * This method will not cause the actual current tab to change.
   * It silently adjusts the index to account for the given move.
   */
  private _adjustCurrentForMove(i: number, j: number): void {
    if (this._currentIndex === i) {
      this._currentIndex = j;
    } else if (this._currentIndex < i && this._currentIndex >= j) {
      this._currentIndex++;
    } else if (this._currentIndex > i && this._currentIndex <= j) {
      this._currentIndex--;
    }
  }

  /**
   * Adjust the current index for a tab remove operation.
   *
   * This method accounts for the tab bar's remove behavior when
   * adjusting the current index and emitting the changed signal.
   */
  private _adjustCurrentForRemove(i: number, title: Title<T>): void {
    // Lookup commonly used variables.
    let ci = this._currentIndex;
    let bh = this.removeBehavior;

    // Silently adjust the index if the current tab is not removed.
    if (ci !== i) {
      if (ci > i) {
        this._currentIndex--;
      }
      return;
    }

    // TODO: do we need to do an update to adjust the aria-selected value?

    // No tab gets selected if the tab bar is empty.
    if (this._titles.length === 0) {
      this._currentIndex = -1;
      this._currentChanged.emit({
        previousIndex: i,
        previousTitle: title,
        currentIndex: -1,
        currentTitle: null
      });
      return;
    }

    // Handle behavior where the next sibling tab is selected.
    if (bh === 'select-tab-after') {
      this._currentIndex = Math.min(i, this._titles.length - 1);
      this._currentChanged.emit({
        previousIndex: i,
        previousTitle: title,
        currentIndex: this._currentIndex,
        currentTitle: this.currentTitle
      });
      return;
    }

    // Handle behavior where the previous sibling tab is selected.
    if (bh === 'select-tab-before') {
      this._currentIndex = Math.max(0, i - 1);
      this._currentChanged.emit({
        previousIndex: i,
        previousTitle: title,
        currentIndex: this._currentIndex,
        currentTitle: this.currentTitle
      });
      return;
    }

    // Handle behavior where the previous history tab is selected.
    if (bh === 'select-previous-tab') {
      if (this._previousTitle) {
        this._currentIndex = this._titles.indexOf(this._previousTitle);
        this._previousTitle = null;
      } else {
        this._currentIndex = Math.min(i, this._titles.length - 1);
      }
      this._currentChanged.emit({
        previousIndex: i,
        previousTitle: title,
        currentIndex: this._currentIndex,
        currentTitle: this.currentTitle
      });
      return;
    }

    // Otherwise, no tab gets selected.
    this._currentIndex = -1;
    this._currentChanged.emit({
      previousIndex: i,
      previousTitle: title,
      currentIndex: -1,
      currentTitle: null
    });
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title<T>): void {
    this.update();
  }

  private _name: string;
  private _currentIndex = -1;
  private _titles: Title<T>[] = [];
  private _orientation: TabBar.Orientation;
  private _document: Document | ShadowRoot;
  private _titlesEditable: boolean = false;
  private _previousTitle: Title<T> | null = null;
  private _dragData: Private.IDragData | null = null;
  private _addButtonEnabled: boolean = false;
  private _tabMoved = new Signal<this, TabBar.ITabMovedArgs<T>>(this);
  private _currentChanged = new Signal<this, TabBar.ICurrentChangedArgs<T>>(
    this
  );
  private _addRequested = new Signal<this, void>(this);
  private _tabCloseRequested = new Signal<
    this,
    TabBar.ITabCloseRequestedArgs<T>
  >(this);
  private _tabDetachRequested = new Signal<
    this,
    TabBar.ITabDetachRequestedArgs<T>
  >(this);
  private _tabActivateRequested = new Signal<
    this,
    TabBar.ITabActivateRequestedArgs<T>
  >(this);
}

/**
 * The namespace for the `TabBar` class statics.
 */
export namespace TabBar {
  /**
   * A type alias for a tab bar orientation.
   */
  export type Orientation =
    | /**
     * The tabs are arranged in a single row, left-to-right.
     *
     * The tab text orientation is horizontal.
     */
    'horizontal'

    /**
     * The tabs are arranged in a single column, top-to-bottom.
     *
     * The tab text orientation is horizontal.
     */
    | 'vertical';

  /**
   * A type alias for the selection behavior on tab insert.
   */
  export type InsertBehavior =
    | /**
     * The selected tab will not be changed.
     */
    'none'

    /**
     * The inserted tab will be selected.
     */
    | 'select-tab'

    /**
     * The inserted tab will be selected if the current tab is null.
     */
    | 'select-tab-if-needed';

  /**
   * A type alias for the selection behavior on tab remove.
   */
  export type RemoveBehavior =
    | /**
     * No tab will be selected.
     */
    'none'

    /**
     * The tab after the removed tab will be selected if possible.
     */
    | 'select-tab-after'

    /**
     * The tab before the removed tab will be selected if possible.
     */
    | 'select-tab-before'

    /**
     * The previously selected tab will be selected if possible.
     */
    | 'select-previous-tab';

  /**
   * An options object for creating a tab bar.
   */
  export interface IOptions<T> {
    /**
     * The document to use with the tab bar.
     *
     * The default is the global `document` instance.
     */

    document?: Document | ShadowRoot;

    /**
     * Name of the tab bar.
     *
     * This is used for accessibility reasons. The default is the empty string.
     */
    name?: string;

    /**
     * The layout orientation of the tab bar.
     *
     * The default is `horizontal`.
     */
    orientation?: TabBar.Orientation;

    /**
     * Whether the tabs are movable by the user.
     *
     * The default is `false`.
     */
    tabsMovable?: boolean;

    /**
     * Whether a tab can be deselected by the user.
     *
     * The default is `false`.
     */
    allowDeselect?: boolean;

    /**
     * Whether the titles can be directly edited by the user.
     *
     * The default is `false`.
     */
    titlesEditable?: boolean;

    /**
     * Whether the add button is enabled.
     *
     * The default is `false`.
     */
    addButtonEnabled?: boolean;

    /**
     * The selection behavior when inserting a tab.
     *
     * The default is `'select-tab-if-needed'`.
     */
    insertBehavior?: TabBar.InsertBehavior;

    /**
     * The selection behavior when removing a tab.
     *
     * The default is `'select-tab-after'`.
     */
    removeBehavior?: TabBar.RemoveBehavior;

    /**
     * A renderer to use with the tab bar.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer<T>;
  }

  /**
   * The arguments object for the `currentChanged` signal.
   */
  export interface ICurrentChangedArgs<T> {
    /**
     * The previously selected index.
     */
    readonly previousIndex: number;

    /**
     * The previously selected title.
     */
    readonly previousTitle: Title<T> | null;

    /**
     * The currently selected index.
     */
    readonly currentIndex: number;

    /**
     * The currently selected title.
     */
    readonly currentTitle: Title<T> | null;
  }

  /**
   * The arguments object for the `tabMoved` signal.
   */
  export interface ITabMovedArgs<T> {
    /**
     * The previous index of the tab.
     */
    readonly fromIndex: number;

    /**
     * The current index of the tab.
     */
    readonly toIndex: number;

    /**
     * The title for the tab.
     */
    readonly title: Title<T>;
  }

  /**
   * The arguments object for the `tabActivateRequested` signal.
   */
  export interface ITabActivateRequestedArgs<T> {
    /**
     * The index of the tab to activate.
     */
    readonly index: number;

    /**
     * The title for the tab.
     */
    readonly title: Title<T>;
  }

  /**
   * The arguments object for the `tabCloseRequested` signal.
   */
  export interface ITabCloseRequestedArgs<T> {
    /**
     * The index of the tab to close.
     */
    readonly index: number;

    /**
     * The title for the tab.
     */
    readonly title: Title<T>;
  }

  /**
   * The arguments object for the `tabDetachRequested` signal.
   */
  export interface ITabDetachRequestedArgs<T> {
    /**
     * The index of the tab to detach.
     */
    readonly index: number;

    /**
     * The title for the tab.
     */
    readonly title: Title<T>;

    /**
     * The node representing the tab.
     */
    readonly tab: HTMLElement;

    /**
     * The current client X position of the mouse.
     */
    readonly clientX: number;

    /**
     * The current client Y position of the mouse.
     */
    readonly clientY: number;
  }

  /**
   * An object which holds the data to render a tab.
   */
  export interface IRenderData<T> {
    /**
     * The title associated with the tab.
     */
    readonly title: Title<T>;

    /**
     * Whether the tab is the current tab.
     */
    readonly current: boolean;

    /**
     * The z-index for the tab.
     */
    readonly zIndex: number;
  }

  /**
   * A renderer for use with a tab bar.
   */
  export interface IRenderer<T> {
    /**
     * A selector which matches the close icon node in a tab.
     */
    readonly closeIconSelector: string;

    /**
     * Render the virtual element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab.
     */
    renderTab(data: IRenderData<T>): VirtualElement;
  }

  /**
   * The default implementation of `IRenderer`.
   *
   * #### Notes
   * Subclasses are free to reimplement rendering methods as needed.
   */
  export class Renderer implements IRenderer<any> {
    /**
     * A selector which matches the close icon node in a tab.
     */
    readonly closeIconSelector = '.lm-TabBar-tabCloseIcon';

    /**
     * Render the virtual element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab.
     */
    renderTab(data: IRenderData<any>): VirtualElement {
      let title = data.title.caption;
      let key = this.createTabKey(data);
      let id = key;
      let style = this.createTabStyle(data);
      let className = this.createTabClass(data);
      let dataset = this.createTabDataset(data);
      let aria = this.createTabARIA(data);
      if (data.title.closable) {
        return h.li(
          { id, key, className, title, style, dataset, ...aria },
          this.renderIcon(data),
          this.renderLabel(data),
          this.renderCloseIcon(data)
        );
      } else {
        return h.li(
          { id, key, className, title, style, dataset, ...aria },
          this.renderIcon(data),
          this.renderLabel(data)
        );
      }
    }

    /**
     * Render the icon element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab icon.
     */
    renderIcon(data: IRenderData<any>): VirtualElement {
      const { title } = data;
      let className = this.createIconClass(data);

      // If title.icon is undefined, it will be ignored.
      return h.div({ className }, title.icon!, title.iconLabel);
    }

    /**
     * Render the label element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab label.
     */
    renderLabel(data: IRenderData<any>): VirtualElement {
      return h.div({ className: 'lm-TabBar-tabLabel' }, data.title.label);
    }

    /**
     * Render the close icon element for a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual element representing the tab close icon.
     */
    renderCloseIcon(data: IRenderData<any>): VirtualElement {
      return h.div({ className: 'lm-TabBar-tabCloseIcon' });
    }

    /**
     * Create a unique render key for the tab.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The unique render key for the tab.
     *
     * #### Notes
     * This method caches the key against the tab title the first time
     * the key is generated. This enables efficient rendering of moved
     * tabs and avoids subtle hover style artifacts.
     */
    createTabKey(data: IRenderData<any>): string {
      let key = this._tabKeys.get(data.title);
      if (key === undefined) {
        key = `tab-key-${this._tabID++}`;
        this._tabKeys.set(data.title, key);
      }
      return key;
    }

    /**
     * Create the inline style object for a tab.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The inline style data for the tab.
     */
    createTabStyle(data: IRenderData<any>): ElementInlineStyle {
      return { zIndex: `${data.zIndex}` };
    }

    /**
     * Create the class name for the tab.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The full class name for the tab.
     */
    createTabClass(data: IRenderData<any>): string {
      let name = 'lm-TabBar-tab';
      if (data.title.className) {
        name += ` ${data.title.className}`;
      }
      if (data.title.closable) {
        name += ' lm-mod-closable';
      }
      if (data.current) {
        name += ' lm-mod-current';
      }
      return name;
    }

    /**
     * Create the dataset for a tab.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The dataset for the tab.
     */
    createTabDataset(data: IRenderData<any>): ElementDataset {
      return data.title.dataset;
    }

    /**
     * Create the ARIA attributes for a tab.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The ARIA attributes for the tab.
     */
    createTabARIA(data: IRenderData<any>): ElementARIAAttrs {
      return { role: 'tab', 'aria-selected': data.current.toString() };
    }

    /**
     * Create the class name for the tab icon.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The full class name for the tab icon.
     */
    createIconClass(data: IRenderData<any>): string {
      let name = 'lm-TabBar-tabIcon';
      let extra = data.title.iconClass;
      return extra ? `${name} ${extra}` : name;
    }

    private _tabID = 0;
    private _tabKeys = new WeakMap<Title<any>, string>();
  }

  /**
   * The default `Renderer` instance.
   */
  export const defaultRenderer = new Renderer();

  /**
   * A selector which matches the add button node in the tab bar.
   */
  export const addButtonSelector = '.lm-TabBar-addButton';
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The start drag distance threshold.
   */
  export const DRAG_THRESHOLD = 5;

  /**
   * The detach distance threshold.
   */
  export const DETACH_THRESHOLD = 20;

  /**
   * A struct which holds the drag data for a tab bar.
   */
  export interface IDragData {
    /**
     * The tab node being dragged.
     */
    tab: HTMLElement;

    /**
     * The index of the tab being dragged.
     */
    index: number;

    /**
     * The mouse press client X position.
     */
    pressX: number;

    /**
     * The mouse press client Y position.
     */
    pressY: number;

    /**
     * The offset left/top of the tab being dragged.
     *
     * This will be `-1` if the drag is not active.
     */
    tabPos: number;

    /**
     * The offset width/height of the tab being dragged.
     *
     * This will be `-1` if the drag is not active.
     */
    tabSize: number;

    /**
     * The original mouse X/Y position in tab coordinates.
     *
     * This will be `-1` if the drag is not active.
     */
    tabPressPos: number;

    /**
     * The tab target index upon mouse release.
     *
     * This will be `-1` if the drag is not active.
     */
    targetIndex: number;

    /**
     * The array of tab layout objects snapped at drag start.
     *
     * This will be `null` if the drag is not active.
     */
    tabLayout: ITabLayout[] | null;

    /**
     * The bounding client rect of the tab bar content node.
     *
     * This will be `null` if the drag is not active.
     */
    contentRect: DOMRect | null;

    /**
     * The disposable to clean up the cursor override.
     *
     * This will be `null` if the drag is not active.
     */
    override: IDisposable | null;

    /**
     * Whether the drag is currently active.
     */
    dragActive: boolean;

    /**
     * Whether the drag has been aborted.
     */
    dragAborted: boolean;

    /**
     * Whether a detach request as been made.
     */
    detachRequested: boolean;
  }

  /**
   * An object which holds layout data for a tab.
   */
  export interface ITabLayout {
    /**
     * The left/top margin value for the tab.
     */
    margin: number;

    /**
     * The offset left/top position of the tab.
     */
    pos: number;

    /**
     * The offset width/height of the tab.
     */
    size: number;
  }

  /**
   * Create the DOM node for a tab bar.
   */
  export function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let content = document.createElement('ul');
    content.setAttribute('role', 'tablist');
    content.className = 'lm-TabBar-content';
    node.appendChild(content);

    let add = document.createElement('div');
    add.className = 'lm-TabBar-addButton lm-mod-hidden';
    node.appendChild(add);
    return node;
  }

  /**
   * Coerce a title or options into a real title.
   */
  export function asTitle<T>(value: Title<T> | Title.IOptions<T>): Title<T> {
    return value instanceof Title ? value : new Title<T>(value);
  }

  /**
   * Parse the transition duration for a tab node.
   */
  export function parseTransitionDuration(tab: HTMLElement): number {
    let style = window.getComputedStyle(tab);
    return 1000 * (parseFloat(style.transitionDuration!) || 0);
  }

  /**
   * Get a snapshot of the current tab layout values.
   */
  export function snapTabLayout(
    tabs: HTMLCollection,
    orientation: TabBar.Orientation
  ): ITabLayout[] {
    let layout = new Array<ITabLayout>(tabs.length);
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let node = tabs[i] as HTMLElement;
      let style = window.getComputedStyle(node);
      if (orientation === 'horizontal') {
        layout[i] = {
          pos: node.offsetLeft,
          size: node.offsetWidth,
          margin: parseFloat(style.marginLeft!) || 0
        };
      } else {
        layout[i] = {
          pos: node.offsetTop,
          size: node.offsetHeight,
          margin: parseFloat(style.marginTop!) || 0
        };
      }
    }
    return layout;
  }

  /**
   * Test if the event exceeds the drag threshold.
   */
  export function dragExceeded(data: IDragData, event: MouseEvent): boolean {
    let dx = Math.abs(event.clientX - data.pressX);
    let dy = Math.abs(event.clientY - data.pressY);
    return dx >= DRAG_THRESHOLD || dy >= DRAG_THRESHOLD;
  }

  /**
   * Test if the event exceeds the drag detach threshold.
   */
  export function detachExceeded(data: IDragData, event: MouseEvent): boolean {
    let rect = data.contentRect!;
    return (
      event.clientX < rect.left - DETACH_THRESHOLD ||
      event.clientX >= rect.right + DETACH_THRESHOLD ||
      event.clientY < rect.top - DETACH_THRESHOLD ||
      event.clientY >= rect.bottom + DETACH_THRESHOLD
    );
  }

  /**
   * Update the relative tab positions and computed target index.
   */
  export function layoutTabs(
    tabs: HTMLCollection,
    data: IDragData,
    event: MouseEvent,
    orientation: TabBar.Orientation
  ): void {
    // Compute the orientation-sensitive values.
    let pressPos: number;
    let localPos: number;
    let clientPos: number;
    let clientSize: number;
    if (orientation === 'horizontal') {
      pressPos = data.pressX;
      localPos = event.clientX - data.contentRect!.left;
      clientPos = event.clientX;
      clientSize = data.contentRect!.width;
    } else {
      pressPos = data.pressY;
      localPos = event.clientY - data.contentRect!.top;
      clientPos = event.clientY;
      clientSize = data.contentRect!.height;
    }

    // Compute the target data.
    let targetIndex = data.index;
    let targetPos = localPos - data.tabPressPos;
    let targetEnd = targetPos + data.tabSize;

    // Update the relative tab positions.
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let pxPos: string;
      let layout = data.tabLayout![i];
      let threshold = layout.pos + (layout.size >> 1);
      if (i < data.index && targetPos < threshold) {
        pxPos = `${data.tabSize + data.tabLayout![i + 1].margin}px`;
        targetIndex = Math.min(targetIndex, i);
      } else if (i > data.index && targetEnd > threshold) {
        pxPos = `${-data.tabSize - layout.margin}px`;
        targetIndex = Math.max(targetIndex, i);
      } else if (i === data.index) {
        let ideal = clientPos - pressPos;
        let limit = clientSize - (data.tabPos + data.tabSize);
        pxPos = `${Math.max(-data.tabPos, Math.min(ideal, limit))}px`;
      } else {
        pxPos = '';
      }
      if (orientation === 'horizontal') {
        (tabs[i] as HTMLElement).style.left = pxPos;
      } else {
        (tabs[i] as HTMLElement).style.top = pxPos;
      }
    }

    // Update the computed target index.
    data.targetIndex = targetIndex;
  }

  /**
   * Position the drag tab at its final resting relative position.
   */
  export function finalizeTabPosition(
    data: IDragData,
    orientation: TabBar.Orientation
  ): void {
    // Compute the orientation-sensitive client size.
    let clientSize: number;
    if (orientation === 'horizontal') {
      clientSize = data.contentRect!.width;
    } else {
      clientSize = data.contentRect!.height;
    }

    // Compute the ideal final tab position.
    let ideal: number;
    if (data.targetIndex === data.index) {
      ideal = 0;
    } else if (data.targetIndex > data.index) {
      let tgt = data.tabLayout![data.targetIndex];
      ideal = tgt.pos + tgt.size - data.tabSize - data.tabPos;
    } else {
      let tgt = data.tabLayout![data.targetIndex];
      ideal = tgt.pos - data.tabPos;
    }

    // Compute the tab position limit.
    let limit = clientSize - (data.tabPos + data.tabSize);
    let final = Math.max(-data.tabPos, Math.min(ideal, limit));

    // Set the final orientation-sensitive position.
    if (orientation === 'horizontal') {
      data.tab.style.left = `${final}px`;
    } else {
      data.tab.style.top = `${final}px`;
    }
  }

  /**
   * Reset the relative positions of the given tabs.
   */
  export function resetTabPositions(
    tabs: HTMLCollection,
    orientation: TabBar.Orientation
  ): void {
    for (const tab of tabs) {
      if (orientation === 'horizontal') {
        (tab as HTMLElement).style.left = '';
      } else {
        (tab as HTMLElement).style.top = '';
      }
    }
  }
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { Platform } from '@lumino/domutils';

import { MessageLoop } from '@lumino/messaging';

import { ISignal, Signal } from '@lumino/signaling';

import { BoxLayout } from './boxlayout';

import { StackedPanel } from './stackedpanel';

import { TabBar } from './tabbar';

import { Widget } from './widget';

/**
 * A widget which combines a `TabBar` and a `StackedPanel`.
 *
 * #### Notes
 * This is a simple panel which handles the common case of a tab bar
 * placed next to a content area. The selected tab controls the widget
 * which is shown in the content area.
 *
 * For use cases which require more control than is provided by this
 * panel, the `TabBar` widget may be used independently.
 */
export class TabPanel extends Widget {
  /**
   * Construct a new tab panel.
   *
   * @param options - The options for initializing the tab panel.
   */
  constructor(options: TabPanel.IOptions = {}) {
    super();
    this.addClass('lm-TabPanel');

    // Create the tab bar and stacked panel.
    this.tabBar = new TabBar<Widget>(options);
    this.tabBar.addClass('lm-TabPanel-tabBar');
    this.stackedPanel = new StackedPanel();
    this.stackedPanel.addClass('lm-TabPanel-stackedPanel');

    // Connect the tab bar signal handlers.
    this.tabBar.tabMoved.connect(this._onTabMoved, this);
    this.tabBar.currentChanged.connect(this._onCurrentChanged, this);
    this.tabBar.tabCloseRequested.connect(this._onTabCloseRequested, this);
    this.tabBar.tabActivateRequested.connect(
      this._onTabActivateRequested,
      this
    );
    this.tabBar.addRequested.connect(this._onTabAddRequested, this);

    // Connect the stacked panel signal handlers.
    this.stackedPanel.widgetRemoved.connect(this._onWidgetRemoved, this);

    // Get the data related to the placement.
    this._tabPlacement = options.tabPlacement || 'top';
    let direction = Private.directionFromPlacement(this._tabPlacement);
    let orientation = Private.orientationFromPlacement(this._tabPlacement);

    // Configure the tab bar for the placement.
    this.tabBar.orientation = orientation;
    this.tabBar.dataset['placement'] = this._tabPlacement;

    // Create the box layout.
    let layout = new BoxLayout({ direction, spacing: 0 });

    // Set the stretch factors for the child widgets.
    BoxLayout.setStretch(this.tabBar, 0);
    BoxLayout.setStretch(this.stackedPanel, 1);

    // Add the child widgets to the layout.
    layout.addWidget(this.tabBar);
    layout.addWidget(this.stackedPanel);

    // Install the layout on the tab panel.
    this.layout = layout;
  }

  /**
   * A signal emitted when the current tab is changed.
   *
   * #### Notes
   * This signal is emitted when the currently selected tab is changed
   * either through user or programmatic interaction.
   *
   * Notably, this signal is not emitted when the index of the current
   * tab changes due to tabs being inserted, removed, or moved. It is
   * only emitted when the actual current tab node is changed.
   */
  get currentChanged(): ISignal<this, TabPanel.ICurrentChangedArgs> {
    return this._currentChanged;
  }

  /**
   * Get the index of the currently selected tab.
   *
   * #### Notes
   * This will be `-1` if no tab is selected.
   */
  get currentIndex(): number {
    return this.tabBar.currentIndex;
  }

  /**
   * Set the index of the currently selected tab.
   *
   * #### Notes
   * If the index is out of range, it will be set to `-1`.
   */
  set currentIndex(value: number) {
    this.tabBar.currentIndex = value;
  }

  /**
   * Get the currently selected widget.
   *
   * #### Notes
   * This will be `null` if there is no selected tab.
   */
  get currentWidget(): Widget | null {
    let title = this.tabBar.currentTitle;
    return title ? title.owner : null;
  }

  /**
   * Set the currently selected widget.
   *
   * #### Notes
   * If the widget is not in the panel, it will be set to `null`.
   */
  set currentWidget(value: Widget | null) {
    this.tabBar.currentTitle = value ? value.title : null;
  }

  /**
   * Get the whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can always be moved programmatically.
   */
  get tabsMovable(): boolean {
    return this.tabBar.tabsMovable;
  }

  /**
   * Set the whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can always be moved programmatically.
   */
  set tabsMovable(value: boolean) {
    this.tabBar.tabsMovable = value;
  }

  /**
   * Get the whether the add button is enabled.
   *
   */
  get addButtonEnabled(): boolean {
    return this.tabBar.addButtonEnabled;
  }

  /**
   * Set the whether the add button is enabled.
   *
   */
  set addButtonEnabled(value: boolean) {
    this.tabBar.addButtonEnabled = value;
  }

  /**
   * Get the tab placement for the tab panel.
   *
   * #### Notes
   * This controls the position of the tab bar relative to the content.
   */
  get tabPlacement(): TabPanel.TabPlacement {
    return this._tabPlacement;
  }

  /**
   * Set the tab placement for the tab panel.
   *
   * #### Notes
   * This controls the position of the tab bar relative to the content.
   */
  set tabPlacement(value: TabPanel.TabPlacement) {
    // Bail if the placement does not change.
    if (this._tabPlacement === value) {
      return;
    }

    // Update the internal value.
    this._tabPlacement = value;

    // Get the values related to the placement.
    let direction = Private.directionFromPlacement(value);
    let orientation = Private.orientationFromPlacement(value);

    // Configure the tab bar for the placement.
    this.tabBar.orientation = orientation;
    this.tabBar.dataset['placement'] = value;

    // Update the layout direction.
    (this.layout as BoxLayout).direction = direction;
  }

  /**
   * A signal emitted when the add button on a tab bar is clicked.
   *
   */
  get addRequested(): ISignal<this, TabBar<Widget>> {
    return this._addRequested;
  }

  /**
   * The tab bar used by the tab panel.
   *
   * #### Notes
   * Modifying the tab bar directly can lead to undefined behavior.
   */
  readonly tabBar: TabBar<Widget>;

  /**
   * The stacked panel used by the tab panel.
   *
   * #### Notes
   * Modifying the panel directly can lead to undefined behavior.
   */
  readonly stackedPanel: StackedPanel;

  /**
   * A read-only array of the widgets in the panel.
   */
  get widgets(): ReadonlyArray<Widget> {
    return this.stackedPanel.widgets;
  }

  /**
   * Add a widget to the end of the tab panel.
   *
   * @param widget - The widget to add to the tab panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   *
   * The widget's `title` is used to populate the tab.
   */
  addWidget(widget: Widget): void {
    this.insertWidget(this.widgets.length, widget);
  }

  /**
   * Insert a widget into the tab panel at a specified index.
   *
   * @param index - The index at which to insert the widget.
   *
   * @param widget - The widget to insert into to the tab panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   *
   * The widget's `title` is used to populate the tab.
   */
  insertWidget(index: number, widget: Widget): void {
    if (widget !== this.currentWidget) {
      widget.hide();
    }
    this.stackedPanel.insertWidget(index, widget);
    this.tabBar.insertTab(index, widget.title);

    widget.node.setAttribute('role', 'tabpanel');

    let renderer = this.tabBar.renderer;
    if (renderer instanceof TabBar.Renderer) {
      let tabId = renderer.createTabKey({
        title: widget.title,
        current: false,
        zIndex: 0
      });
      widget.node.setAttribute('aria-labelledby', tabId);
    }
  }

  /**
   * Handle the `currentChanged` signal from the tab bar.
   */
  private _onCurrentChanged(
    sender: TabBar<Widget>,
    args: TabBar.ICurrentChangedArgs<Widget>
  ): void {
    // Extract the previous and current title from the args.
    let { previousIndex, previousTitle, currentIndex, currentTitle } = args;

    // Extract the widgets from the titles.
    let previousWidget = previousTitle ? previousTitle.owner : null;
    let currentWidget = currentTitle ? currentTitle.owner : null;

    // Hide the previous widget.
    if (previousWidget) {
      previousWidget.hide();
    }

    // Show the current widget.
    if (currentWidget) {
      currentWidget.show();
    }

    // Emit the `currentChanged` signal for the tab panel.
    this._currentChanged.emit({
      previousIndex,
      previousWidget,
      currentIndex,
      currentWidget
    });

    // Flush the message loop on IE and Edge to prevent flicker.
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush();
    }
  }

  /**
   * Handle the `tabAddRequested` signal from the tab bar.
   */
  private _onTabAddRequested(sender: TabBar<Widget>, args: void): void {
    this._addRequested.emit(sender);
  }

  /**
   * Handle the `tabActivateRequested` signal from the tab bar.
   */
  private _onTabActivateRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabActivateRequestedArgs<Widget>
  ): void {
    args.title.owner.activate();
  }

  /**
   * Handle the `tabCloseRequested` signal from the tab bar.
   */
  private _onTabCloseRequested(
    sender: TabBar<Widget>,
    args: TabBar.ITabCloseRequestedArgs<Widget>
  ): void {
    args.title.owner.close();
  }

  /**
   * Handle the `tabMoved` signal from the tab bar.
   */
  private _onTabMoved(
    sender: TabBar<Widget>,
    args: TabBar.ITabMovedArgs<Widget>
  ): void {
    this.stackedPanel.insertWidget(args.toIndex, args.title.owner);
  }

  /**
   * Handle the `widgetRemoved` signal from the stacked panel.
   */
  private _onWidgetRemoved(sender: StackedPanel, widget: Widget): void {
    widget.node.removeAttribute('role');
    widget.node.removeAttribute('aria-labelledby');
    this.tabBar.removeTab(widget.title);
  }

  private _tabPlacement: TabPanel.TabPlacement;
  private _currentChanged = new Signal<this, TabPanel.ICurrentChangedArgs>(
    this
  );

  private _addRequested = new Signal<this, TabBar<Widget>>(this);
}

/**
 * The namespace for the `TabPanel` class statics.
 */
export namespace TabPanel {
  /**
   * A type alias for tab placement in a tab bar.
   */
  export type TabPlacement =
    | /**
     * The tabs are placed as a row above the content.
     */
    'top'

    /**
     * The tabs are placed as a column to the left of the content.
     */
    | 'left'

    /**
     * The tabs are placed as a column to the right of the content.
     */
    | 'right'

    /**
     * The tabs are placed as a row below the content.
     */
    | 'bottom';

  /**
   * An options object for initializing a tab panel.
   */
  export interface IOptions {
    /**
     * The document to use with the tab panel.
     *
     * The default is the global `document` instance.
     */
    document?: Document | ShadowRoot;

    /**
     * Whether the tabs are movable by the user.
     *
     * The default is `false`.
     */
    tabsMovable?: boolean;

    /**
     * Whether the button to add new tabs is enabled.
     *
     * The default is `false`.
     */
    addButtonEnabled?: boolean;

    /**
     * The placement of the tab bar relative to the content.
     *
     * The default is `'top'`.
     */
    tabPlacement?: TabPlacement;

    /**
     * The renderer for the panel's tab bar.
     *
     * The default is a shared renderer instance.
     */
    renderer?: TabBar.IRenderer<Widget>;
  }

  /**
   * The arguments object for the `currentChanged` signal.
   */
  export interface ICurrentChangedArgs {
    /**
     * The previously selected index.
     */
    previousIndex: number;

    /**
     * The previously selected widget.
     */
    previousWidget: Widget | null;

    /**
     * The currently selected index.
     */
    currentIndex: number;

    /**
     * The currently selected widget.
     */
    currentWidget: Widget | null;
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Convert a tab placement to tab bar orientation.
   */
  export function orientationFromPlacement(
    plc: TabPanel.TabPlacement
  ): TabBar.Orientation {
    return placementToOrientationMap[plc];
  }

  /**
   * Convert a tab placement to a box layout direction.
   */
  export function directionFromPlacement(
    plc: TabPanel.TabPlacement
  ): BoxLayout.Direction {
    return placementToDirectionMap[plc];
  }

  /**
   * A mapping of tab placement to tab bar orientation.
   */
  const placementToOrientationMap: { [key: string]: TabBar.Orientation } = {
    top: 'horizontal',
    left: 'vertical',
    right: 'vertical',
    bottom: 'horizontal'
  };

  /**
   * A mapping of tab placement to box layout direction.
   */
  const placementToDirectionMap: { [key: string]: BoxLayout.Direction } = {
    top: 'top-to-bottom',
    left: 'left-to-right',
    right: 'right-to-left',
    bottom: 'bottom-to-top'
  };
}
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { IDisposable } from '@lumino/disposable';

import { ISignal, Signal } from '@lumino/signaling';

import { VirtualElement } from '@lumino/virtualdom';

/**
 * An object which holds data related to an object's title.
 *
 * #### Notes
 * A title object is intended to hold the data necessary to display a
 * header for a particular object. A common example is the `TabPanel`,
 * which uses the widget title to populate the tab for a child widget.
 *
 * It is the responsibility of the owner to call the title disposal.
 */
export class Title<T> implements IDisposable {
  /**
   * Construct a new title.
   *
   * @param options - The options for initializing the title.
   */
  constructor(options: Title.IOptions<T>) {
    this.owner = options.owner;
    if (options.label !== undefined) {
      this._label = options.label;
    }
    if (options.mnemonic !== undefined) {
      this._mnemonic = options.mnemonic;
    }
    if (options.icon !== undefined) {
      this._icon = options.icon;
    }

    if (options.iconClass !== undefined) {
      this._iconClass = options.iconClass;
    }
    if (options.iconLabel !== undefined) {
      this._iconLabel = options.iconLabel;
    }
    if (options.caption !== undefined) {
      this._caption = options.caption;
    }
    if (options.className !== undefined) {
      this._className = options.className;
    }
    if (options.closable !== undefined) {
      this._closable = options.closable;
    }
    this._dataset = options.dataset || {};
  }

  /**
   * A signal emitted when the state of the title changes.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * The object which owns the title.
   */
  readonly owner: T;

  /**
   * Get the label for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get label(): string {
    return this._label;
  }

  /**
   * Set the label for the title.
   */
  set label(value: string) {
    if (this._label === value) {
      return;
    }
    this._label = value;
    this._changed.emit(undefined);
  }

  /**
   * Get the mnemonic index for the title.
   *
   * #### Notes
   * The default value is `-1`.
   */
  get mnemonic(): number {
    return this._mnemonic;
  }

  /**
   * Set the mnemonic index for the title.
   */
  set mnemonic(value: number) {
    if (this._mnemonic === value) {
      return;
    }
    this._mnemonic = value;
    this._changed.emit(undefined);
  }

  /**
   * Get the icon renderer for the title.
   *
   * #### Notes
   * The default value is undefined.
   */
  get icon(): VirtualElement.IRenderer | undefined {
    return this._icon;
  }

  /**
   * Set the icon renderer for the title.
   *
   * #### Notes
   * A renderer is an object that supplies a render and unrender function.
   */
  set icon(value: VirtualElement.IRenderer | undefined) {
    if (this._icon === value) {
      return;
    }
    this._icon = value;
    this._changed.emit(undefined);
  }

  /**
   * Get the icon class name for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get iconClass(): string {
    return this._iconClass;
  }

  /**
   * Set the icon class name for the title.
   *
   * #### Notes
   * Multiple class names can be separated with whitespace.
   */
  set iconClass(value: string) {
    if (this._iconClass === value) {
      return;
    }
    this._iconClass = value;
    this._changed.emit(undefined);
  }

  /**
   * Get the icon label for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get iconLabel(): string {
    return this._iconLabel;
  }

  /**
   * Set the icon label for the title.
   *
   * #### Notes
   * Multiple class names can be separated with whitespace.
   */
  set iconLabel(value: string) {
    if (this._iconLabel === value) {
      return;
    }
    this._iconLabel = value;
    this._changed.emit(undefined);
  }

  /**
   * Get the caption for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get caption(): string {
    return this._caption;
  }

  /**
   * Set the caption for the title.
   */
  set caption(value: string) {
    if (this._caption === value) {
      return;
    }
    this._caption = value;
    this._changed.emit(undefined);
  }

  /**
   * Get the extra class name for the title.
   *
   * #### Notes
   * The default value is an empty string.
   */
  get className(): string {
    return this._className;
  }

  /**
   * Set the extra class name for the title.
   *
   * #### Notes
   * Multiple class names can be separated with whitespace.
   */
  set className(value: string) {
    if (this._className === value) {
      return;
    }
    this._className = value;
    this._changed.emit(undefined);
  }

  /**
   * Get the closable state for the title.
   *
   * #### Notes
   * The default value is `false`.
   */
  get closable(): boolean {
    return this._closable;
  }

  /**
   * Set the closable state for the title.
   *
   * #### Notes
   * This controls the presence of a close icon when applicable.
   */
  set closable(value: boolean) {
    if (this._closable === value) {
      return;
    }
    this._closable = value;
    this._changed.emit(undefined);
  }

  /**
   * Get the dataset for the title.
   *
   * #### Notes
   * The default value is an empty dataset.
   */
  get dataset(): Title.Dataset {
    return this._dataset;
  }

  /**
   * Set the dataset for the title.
   *
   * #### Notes
   * This controls the data attributes when applicable.
   */
  set dataset(value: Title.Dataset) {
    if (this._dataset === value) {
      return;
    }
    this._dataset = value;
    this._changed.emit(undefined);
  }

  /**
   * Test whether the title has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources held by the title.
   *
   * #### Notes
   * It is the responsibility of the owner to call the title disposal.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;

    Signal.clearData(this);
  }

  private _label = '';
  private _caption = '';
  private _mnemonic = -1;
  private _icon: VirtualElement.IRenderer | undefined = undefined;
  private _iconClass = '';
  private _iconLabel = '';
  private _className = '';
  private _closable = false;
  private _dataset: Title.Dataset;
  private _changed = new Signal<this, void>(this);
  private _isDisposed = false;
}

/**
 * The namespace for the `Title` class statics.
 */
export namespace Title {
  /**
   * A type alias for a simple immutable string dataset.
   */
  export type Dataset = { readonly [key: string]: string };

  /**
   * An options object for initializing a title.
   */
  export interface IOptions<T> {
    /**
     * The object which owns the title.
     */
    owner: T;

    /**
     * The label for the title.
     */
    label?: string;

    /**
     * The mnemonic index for the title.
     */
    mnemonic?: number;

    /**
     * The icon renderer for the title.
     */
    icon?: VirtualElement.IRenderer;

    /**
     * The icon class name for the title.
     */
    iconClass?: string;

    /**
     * The icon label for the title.
     */
    iconLabel?: string;

    /**
     * The caption for the title.
     */
    caption?: string;

    /**
     * The extra class name for the title.
     */
    className?: string;

    /**
     * The closable state for the title.
     */
    closable?: boolean;

    /**
     * The dataset for the title.
     */
    dataset?: Dataset;
  }
}
/*
 * Copyright (c) Jupyter Development Team.
 * Distributed under the terms of the Modified BSD License.
 */

export namespace Utils {
  /**
   * Clamp a dimension value to an integer >= 0.
   */
  export function clampDimension(value: number): number {
    return Math.max(0, Math.floor(value));
  }
}

export default Utils;
/* eslint-disable @typescript-eslint/no-empty-function */
// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import { IObservableDisposable } from '@lumino/disposable';

import {
  ConflatableMessage,
  IMessageHandler,
  Message,
  MessageLoop
} from '@lumino/messaging';

import { AttachedProperty } from '@lumino/properties';

import { ISignal, Signal } from '@lumino/signaling';

import { Layout } from './layout';

import { Title } from './title';

/**
 * The base class of the lumino widget hierarchy.
 *
 * #### Notes
 * This class will typically be subclassed in order to create a useful
 * widget. However, it can be used directly to host externally created
 * content.
 */
export class Widget implements IMessageHandler, IObservableDisposable {
  /**
   * Construct a new widget.
   *
   * @param options - The options for initializing the widget.
   */
  constructor(options: Widget.IOptions = {}) {
    this.node = Private.createNode(options);
    this.addClass('lm-Widget');
  }

  /**
   * Dispose of the widget and its descendant widgets.
   *
   * #### Notes
   * It is unsafe to use the widget after it has been disposed.
   *
   * All calls made to this method after the first are a no-op.
   */
  dispose(): void {
    // Do nothing if the widget is already disposed.
    if (this.isDisposed) {
      return;
    }

    // Set the disposed flag and emit the disposed signal.
    this.setFlag(Widget.Flag.IsDisposed);
    this._disposed.emit(undefined);

    // Remove or detach the widget if necessary.
    if (this.parent) {
      this.parent = null;
    } else if (this.isAttached) {
      Widget.detach(this);
    }

    // Dispose of the widget layout.
    if (this._layout) {
      this._layout.dispose();
      this._layout = null;
    }

    // Dispose the title
    this.title.dispose();

    // Clear the extra data associated with the widget.
    Signal.clearData(this);
    MessageLoop.clearData(this);
    AttachedProperty.clearData(this);
  }

  /**
   * A signal emitted when the widget is disposed.
   */
  get disposed(): ISignal<this, void> {
    return this._disposed;
  }

  /**
   * Get the DOM node owned by the widget.
   */
  readonly node: HTMLElement;

  /**
   * Test whether the widget has been disposed.
   */
  get isDisposed(): boolean {
    return this.testFlag(Widget.Flag.IsDisposed);
  }

  /**
   * Test whether the widget's node is attached to the DOM.
   */
  get isAttached(): boolean {
    return this.testFlag(Widget.Flag.IsAttached);
  }

  /**
   * Test whether the widget is explicitly hidden.
   */
  get isHidden(): boolean {
    return this.testFlag(Widget.Flag.IsHidden);
  }

  /**
   * Test whether the widget is visible.
   *
   * #### Notes
   * A widget is visible when it is attached to the DOM, is not
   * explicitly hidden, and has no explicitly hidden ancestors.
   */
  get isVisible(): boolean {
    return this.testFlag(Widget.Flag.IsVisible);
  }

  /**
   * The title object for the widget.
   *
   * #### Notes
   * The title object is used by some container widgets when displaying
   * the widget alongside some title, such as a tab panel or side bar.
   *
   * Since not all widgets will use the title, it is created on demand.
   *
   * The `owner` property of the title is set to this widget.
   */
  get title(): Title<Widget> {
    return Private.titleProperty.get(this);
  }

  /**
   * Get the id of the widget's DOM node.
   */
  get id(): string {
    return this.node.id;
  }

  /**
   * Set the id of the widget's DOM node.
   */
  set id(value: string) {
    this.node.id = value;
  }

  /**
   * The dataset for the widget's DOM node.
   */
  get dataset(): DOMStringMap {
    return this.node.dataset;
  }

  /**
   * Get the method for hiding the widget.
   */
  get hiddenMode(): Widget.HiddenMode {
    return this._hiddenMode;
  }

  /**
   * Set the method for hiding the widget.
   */
  set hiddenMode(value: Widget.HiddenMode) {
    if (this._hiddenMode === value) {
      return;
    }
    this._hiddenMode = value;
    switch (value) {
      case Widget.HiddenMode.Display:
        this.node.style.willChange = 'auto';
        break;
      case Widget.HiddenMode.Scale:
        this.node.style.willChange = 'transform';
        break;
    }

    if (this.isHidden) {
      if (value === Widget.HiddenMode.Display) {
        this.addClass('lm-mod-hidden');
        this.node.style.transform = '';
      } else {
        this.node.style.transform = 'scale(0)';
        this.removeClass('lm-mod-hidden');
      }
    }
  }

  /**
   * Get the parent of the widget.
   */
  get parent(): Widget | null {
    return this._parent;
  }

  /**
   * Set the parent of the widget.
   *
   * #### Notes
   * Children are typically added to a widget by using a layout, which
   * means user code will not normally set the parent widget directly.
   *
   * The widget will be automatically removed from its old parent.
   *
   * This is a no-op if there is no effective parent change.
   */
  set parent(value: Widget | null) {
    if (this._parent === value) {
      return;
    }
    if (value && this.contains(value)) {
      throw new Error('Invalid parent widget.');
    }
    if (this._parent && !this._parent.isDisposed) {
      let msg = new Widget.ChildMessage('child-removed', this);
      MessageLoop.sendMessage(this._parent, msg);
    }
    this._parent = value;
    if (this._parent && !this._parent.isDisposed) {
      let msg = new Widget.ChildMessage('child-added', this);
      MessageLoop.sendMessage(this._parent, msg);
    }
    if (!this.isDisposed) {
      MessageLoop.sendMessage(this, Widget.Msg.ParentChanged);
    }
  }

  /**
   * Get the layout for the widget.
   */
  get layout(): Layout | null {
    return this._layout;
  }

  /**
   * Set the layout for the widget.
   *
   * #### Notes
   * The layout is single-use only. It cannot be changed after the
   * first assignment.
   *
   * The layout is disposed automatically when the widget is disposed.
   */
  set layout(value: Layout | null) {
    if (this._layout === value) {
      return;
    }
    if (this.testFlag(Widget.Flag.DisallowLayout)) {
      throw new Error('Cannot set widget layout.');
    }
    if (this._layout) {
      throw new Error('Cannot change widget layout.');
    }
    if (value!.parent) {
      throw new Error('Cannot change layout parent.');
    }
    this._layout = value;
    value!.parent = this;
  }

  /**
   * Create an iterator over the widget's children.
   *
   * @returns A new iterator over the children of the widget.
   *
   * #### Notes
   * The widget must have a populated layout in order to have children.
   *
   * If a layout is not installed, the returned iterator will be empty.
   */
  *children(): IterableIterator<Widget> {
    if (this._layout) {
      yield* this._layout;
    }
  }

  /**
   * Test whether a widget is a descendant of this widget.
   *
   * @param widget - The descendant widget of interest.
   *
   * @returns `true` if the widget is a descendant, `false` otherwise.
   */
  contains(widget: Widget): boolean {
    for (let value: Widget | null = widget; value; value = value._parent) {
      if (value === this) {
        return true;
      }
    }
    return false;
  }

  /**
   * Test whether the widget's DOM node has the given class name.
   *
   * @param name - The class name of interest.
   *
   * @returns `true` if the node has the class, `false` otherwise.
   */
  hasClass(name: string): boolean {
    return this.node.classList.contains(name);
  }

  /**
   * Add a class name to the widget's DOM node.
   *
   * @param name - The class name to add to the node.
   *
   * #### Notes
   * If the class name is already added to the node, this is a no-op.
   *
   * The class name must not contain whitespace.
   */
  addClass(name: string): void {
    this.node.classList.add(name);
  }

  /**
   * Remove a class name from the widget's DOM node.
   *
   * @param name - The class name to remove from the node.
   *
   * #### Notes
   * If the class name is not yet added to the node, this is a no-op.
   *
   * The class name must not contain whitespace.
   */
  removeClass(name: string): void {
    this.node.classList.remove(name);
  }

  /**
   * Toggle a class name on the widget's DOM node.
   *
   * @param name - The class name to toggle on the node.
   *
   * @param force - Whether to force add the class (`true`) or force
   *   remove the class (`false`). If not provided, the presence of
   *   the class will be toggled from its current state.
   *
   * @returns `true` if the class is now present, `false` otherwise.
   *
   * #### Notes
   * The class name must not contain whitespace.
   */
  toggleClass(name: string, force?: boolean): boolean {
    if (force === true) {
      this.node.classList.add(name);
      return true;
    }
    if (force === false) {
      this.node.classList.remove(name);
      return false;
    }
    return this.node.classList.toggle(name);
  }

  /**
   * Post an `'update-request'` message to the widget.
   *
   * #### Notes
   * This is a simple convenience method for posting the message.
   */
  update(): void {
    MessageLoop.postMessage(this, Widget.Msg.UpdateRequest);
  }

  /**
   * Post a `'fit-request'` message to the widget.
   *
   * #### Notes
   * This is a simple convenience method for posting the message.
   */
  fit(): void {
    MessageLoop.postMessage(this, Widget.Msg.FitRequest);
  }

  /**
   * Post an `'activate-request'` message to the widget.
   *
   * #### Notes
   * This is a simple convenience method for posting the message.
   */
  activate(): void {
    MessageLoop.postMessage(this, Widget.Msg.ActivateRequest);
  }

  /**
   * Send a `'close-request'` message to the widget.
   *
   * #### Notes
   * This is a simple convenience method for sending the message.
   */
  close(): void {
    MessageLoop.sendMessage(this, Widget.Msg.CloseRequest);
  }

  /**
   * Show the widget and make it visible to its parent widget.
   *
   * #### Notes
   * This causes the [[isHidden]] property to be `false`.
   *
   * If the widget is not explicitly hidden, this is a no-op.
   */
  show(): void {
    if (!this.testFlag(Widget.Flag.IsHidden)) {
      return;
    }
    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      MessageLoop.sendMessage(this, Widget.Msg.BeforeShow);
    }
    this.clearFlag(Widget.Flag.IsHidden);
    this.node.removeAttribute('aria-hidden');
    if (this.hiddenMode === Widget.HiddenMode.Display) {
      this.removeClass('lm-mod-hidden');
    } else {
      this.node.style.transform = '';
    }

    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      MessageLoop.sendMessage(this, Widget.Msg.AfterShow);
    }
    if (this.parent) {
      let msg = new Widget.ChildMessage('child-shown', this);
      MessageLoop.sendMessage(this.parent, msg);
    }
  }

  /**
   * Hide the widget and make it hidden to its parent widget.
   *
   * #### Notes
   * This causes the [[isHidden]] property to be `true`.
   *
   * If the widget is explicitly hidden, this is a no-op.
   */
  hide(): void {
    if (this.testFlag(Widget.Flag.IsHidden)) {
      return;
    }
    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      MessageLoop.sendMessage(this, Widget.Msg.BeforeHide);
    }
    this.setFlag(Widget.Flag.IsHidden);
    this.node.setAttribute('aria-hidden', 'true');
    if (this.hiddenMode === Widget.HiddenMode.Display) {
      this.addClass('lm-mod-hidden');
    } else {
      this.node.style.transform = 'scale(0)';
    }

    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      MessageLoop.sendMessage(this, Widget.Msg.AfterHide);
    }
    if (this.parent) {
      let msg = new Widget.ChildMessage('child-hidden', this);
      MessageLoop.sendMessage(this.parent, msg);
    }
  }

  /**
   * Show or hide the widget according to a boolean value.
   *
   * @param hidden - `true` to hide the widget, or `false` to show it.
   *
   * #### Notes
   * This is a convenience method for `hide()` and `show()`.
   */
  setHidden(hidden: boolean): void {
    if (hidden) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Test whether the given widget flag is set.
   *
   * #### Notes
   * This will not typically be called directly by user code.
   */
  testFlag(flag: Widget.Flag): boolean {
    return (this._flags & flag) !== 0;
  }

  /**
   * Set the given widget flag.
   *
   * #### Notes
   * This will not typically be called directly by user code.
   */
  setFlag(flag: Widget.Flag): void {
    this._flags |= flag;
  }

  /**
   * Clear the given widget flag.
   *
   * #### Notes
   * This will not typically be called directly by user code.
   */
  clearFlag(flag: Widget.Flag): void {
    this._flags &= ~flag;
  }

  /**
   * Process a message sent to the widget.
   *
   * @param msg - The message sent to the widget.
   *
   * #### Notes
   * Subclasses may reimplement this method as needed.
   */
  processMessage(msg: Message): void {
    switch (msg.type) {
      case 'resize':
        this.notifyLayout(msg);
        this.onResize(msg as Widget.ResizeMessage);
        break;
      case 'update-request':
        this.notifyLayout(msg);
        this.onUpdateRequest(msg);
        break;
      case 'fit-request':
        this.notifyLayout(msg);
        this.onFitRequest(msg);
        break;
      case 'before-show':
        this.notifyLayout(msg);
        this.onBeforeShow(msg);
        break;
      case 'after-show':
        this.setFlag(Widget.Flag.IsVisible);
        this.notifyLayout(msg);
        this.onAfterShow(msg);
        break;
      case 'before-hide':
        this.notifyLayout(msg);
        this.onBeforeHide(msg);
        break;
      case 'after-hide':
        this.clearFlag(Widget.Flag.IsVisible);
        this.notifyLayout(msg);
        this.onAfterHide(msg);
        break;
      case 'before-attach':
        this.notifyLayout(msg);
        this.onBeforeAttach(msg);
        break;
      case 'after-attach':
        if (!this.isHidden && (!this.parent || this.parent.isVisible)) {
          this.setFlag(Widget.Flag.IsVisible);
        }
        this.setFlag(Widget.Flag.IsAttached);
        this.notifyLayout(msg);
        this.onAfterAttach(msg);
        break;
      case 'before-detach':
        this.notifyLayout(msg);
        this.onBeforeDetach(msg);
        break;
      case 'after-detach':
        this.clearFlag(Widget.Flag.IsVisible);
        this.clearFlag(Widget.Flag.IsAttached);
        this.notifyLayout(msg);
        this.onAfterDetach(msg);
        break;
      case 'activate-request':
        this.notifyLayout(msg);
        this.onActivateRequest(msg);
        break;
      case 'close-request':
        this.notifyLayout(msg);
        this.onCloseRequest(msg);
        break;
      case 'child-added':
        this.notifyLayout(msg);
        this.onChildAdded(msg as Widget.ChildMessage);
        break;
      case 'child-removed':
        this.notifyLayout(msg);
        this.onChildRemoved(msg as Widget.ChildMessage);
        break;
      default:
        this.notifyLayout(msg);
        break;
    }
  }

  /**
   * Invoke the message processing routine of the widget's layout.
   *
   * @param msg - The message to dispatch to the layout.
   *
   * #### Notes
   * This is a no-op if the widget does not have a layout.
   *
   * This will not typically be called directly by user code.
   */
  protected notifyLayout(msg: Message): void {
    if (this._layout) {
      this._layout.processParentMessage(msg);
    }
  }

  /**
   * A message handler invoked on a `'close-request'` message.
   *
   * #### Notes
   * The default implementation unparents or detaches the widget.
   */
  protected onCloseRequest(msg: Message): void {
    if (this.parent) {
      this.parent = null;
    } else if (this.isAttached) {
      Widget.detach(this);
    }
  }

  /**
   * A message handler invoked on a `'resize'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onResize(msg: Widget.ResizeMessage): void {}

  /**
   * A message handler invoked on an `'update-request'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onUpdateRequest(msg: Message): void {}

  /**
   * A message handler invoked on a `'fit-request'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onFitRequest(msg: Message): void {}

  /**
   * A message handler invoked on an `'activate-request'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onActivateRequest(msg: Message): void {}

  /**
   * A message handler invoked on a `'before-show'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onBeforeShow(msg: Message): void {}

  /**
   * A message handler invoked on an `'after-show'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onAfterShow(msg: Message): void {}

  /**
   * A message handler invoked on a `'before-hide'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onBeforeHide(msg: Message): void {}

  /**
   * A message handler invoked on an `'after-hide'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onAfterHide(msg: Message): void {}

  /**
   * A message handler invoked on a `'before-attach'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onBeforeAttach(msg: Message): void {}

  /**
   * A message handler invoked on an `'after-attach'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onAfterAttach(msg: Message): void {}

  /**
   * A message handler invoked on a `'before-detach'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onBeforeDetach(msg: Message): void {}

  /**
   * A message handler invoked on an `'after-detach'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onAfterDetach(msg: Message): void {}

  /**
   * A message handler invoked on a `'child-added'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildAdded(msg: Widget.ChildMessage): void {}

  /**
   * A message handler invoked on a `'child-removed'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {}

  private _flags = 0;
  private _layout: Layout | null = null;
  private _parent: Widget | null = null;
  private _disposed = new Signal<this, void>(this);
  private _hiddenMode: Widget.HiddenMode = Widget.HiddenMode.Display;
}

/**
 * The namespace for the `Widget` class statics.
 */
export namespace Widget {
  /**
   * An options object for initializing a widget.
   */
  export interface IOptions {
    /**
     * The optional node to use for the widget.
     *
     * If a node is provided, the widget will assume full ownership
     * and control of the node, as if it had created the node itself.
     *
     * The default is a new `<div>`.
     */
    node?: HTMLElement;

    /**
     * The optional element tag, used for constructing the widget's node.
     *
     * If a pre-constructed node is provided via the `node` arg, this
     * value is ignored.
     */
    tag?: keyof HTMLElementTagNameMap;
  }

  /**
   * The method for hiding the widget.
   *
   * The default is Display.
   *
   * Using `Scale` will often increase performance as most browsers will not
   * trigger style computation for the `transform` action. This should be used
   * sparingly and tested, since increasing the number of composition layers
   * may slow things down.
   *
   * To ensure the transformation does not trigger style recomputation, you
   * may need to set the widget CSS style `will-change: transform`. This
   * should be used only when needed as it may overwhelm the browser with a
   * high number of layers. See
   * https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
   */
  export enum HiddenMode {
    /**
     * Set a `lm-mod-hidden` CSS class to hide the widget using `display:none`
     * CSS from the standard Lumino CSS.
     */
    Display = 0,

    /**
     * Hide the widget by setting the `transform` to `'scale(0)'`.
     */
    Scale
  }

  /**
   * An enum of widget bit flags.
   */
  export enum Flag {
    /**
     * The widget has been disposed.
     */
    IsDisposed = 0x1,

    /**
     * The widget is attached to the DOM.
     */
    IsAttached = 0x2,

    /**
     * The widget is hidden.
     */
    IsHidden = 0x4,

    /**
     * The widget is visible.
     */
    IsVisible = 0x8,

    /**
     * A layout cannot be set on the widget.
     */
    DisallowLayout = 0x10
  }

  /**
   * A collection of stateless messages related to widgets.
   */
  export namespace Msg {
    /**
     * A singleton `'before-show'` message.
     *
     * #### Notes
     * This message is sent to a widget before it becomes visible.
     *
     * This message is **not** sent when the widget is being attached.
     */
    export const BeforeShow = new Message('before-show');

    /**
     * A singleton `'after-show'` message.
     *
     * #### Notes
     * This message is sent to a widget after it becomes visible.
     *
     * This message is **not** sent when the widget is being attached.
     */
    export const AfterShow = new Message('after-show');

    /**
     * A singleton `'before-hide'` message.
     *
     * #### Notes
     * This message is sent to a widget before it becomes not-visible.
     *
     * This message is **not** sent when the widget is being detached.
     */
    export const BeforeHide = new Message('before-hide');

    /**
     * A singleton `'after-hide'` message.
     *
     * #### Notes
     * This message is sent to a widget after it becomes not-visible.
     *
     * This message is **not** sent when the widget is being detached.
     */
    export const AfterHide = new Message('after-hide');

    /**
     * A singleton `'before-attach'` message.
     *
     * #### Notes
     * This message is sent to a widget before it is attached.
     */
    export const BeforeAttach = new Message('before-attach');

    /**
     * A singleton `'after-attach'` message.
     *
     * #### Notes
     * This message is sent to a widget after it is attached.
     */
    export const AfterAttach = new Message('after-attach');

    /**
     * A singleton `'before-detach'` message.
     *
     * #### Notes
     * This message is sent to a widget before it is detached.
     */
    export const BeforeDetach = new Message('before-detach');

    /**
     * A singleton `'after-detach'` message.
     *
     * #### Notes
     * This message is sent to a widget after it is detached.
     */
    export const AfterDetach = new Message('after-detach');

    /**
     * A singleton `'parent-changed'` message.
     *
     * #### Notes
     * This message is sent to a widget when its parent has changed.
     */
    export const ParentChanged = new Message('parent-changed');

    /**
     * A singleton conflatable `'update-request'` message.
     *
     * #### Notes
     * This message can be dispatched to supporting widgets in order to
     * update their content based on the current widget state. Not all
     * widgets will respond to messages of this type.
     *
     * For widgets with a layout, this message will inform the layout to
     * update the position and size of its child widgets.
     */
    export const UpdateRequest = new ConflatableMessage('update-request');

    /**
     * A singleton conflatable `'fit-request'` message.
     *
     * #### Notes
     * For widgets with a layout, this message will inform the layout to
     * recalculate its size constraints to fit the space requirements of
     * its child widgets, and to update their position and size. Not all
     * layouts will respond to messages of this type.
     */
    export const FitRequest = new ConflatableMessage('fit-request');

    /**
     * A singleton conflatable `'activate-request'` message.
     *
     * #### Notes
     * This message should be dispatched to a widget when it should
     * perform the actions necessary to activate the widget, which
     * may include focusing its node or descendant node.
     */
    export const ActivateRequest = new ConflatableMessage('activate-request');

    /**
     * A singleton conflatable `'close-request'` message.
     *
     * #### Notes
     * This message should be dispatched to a widget when it should close
     * and remove itself from the widget hierarchy.
     */
    export const CloseRequest = new ConflatableMessage('close-request');
  }

  /**
   * A message class for child related messages.
   */
  export class ChildMessage extends Message {
    /**
     * Construct a new child message.
     *
     * @param type - The message type.
     *
     * @param child - The child widget for the message.
     */
    constructor(type: string, child: Widget) {
      super(type);
      this.child = child;
    }

    /**
     * The child widget for the message.
     */
    readonly child: Widget;
  }

  /**
   * A message class for `'resize'` messages.
   */
  export class ResizeMessage extends Message {
    /**
     * Construct a new resize message.
     *
     * @param width - The **offset width** of the widget, or `-1` if
     *   the width is not known.
     *
     * @param height - The **offset height** of the widget, or `-1` if
     *   the height is not known.
     */
    constructor(width: number, height: number) {
      super('resize');
      this.width = width;
      this.height = height;
    }

    /**
     * The offset width of the widget.
     *
     * #### Notes
     * This will be `-1` if the width is unknown.
     */
    readonly width: number;

    /**
     * The offset height of the widget.
     *
     * #### Notes
     * This will be `-1` if the height is unknown.
     */
    readonly height: number;
  }

  /**
   * The namespace for the `ResizeMessage` class statics.
   */
  export namespace ResizeMessage {
    /**
     * A singleton `'resize'` message with an unknown size.
     */
    export const UnknownSize = new ResizeMessage(-1, -1);
  }

  /**
   * Attach a widget to a host DOM node.
   *
   * @param widget - The widget of interest.
   *
   * @param host - The DOM node to use as the widget's host.
   *
   * @param ref - The child of `host` to use as the reference element.
   *   If this is provided, the widget will be inserted before this
   *   node in the host. The default is `null`, which will cause the
   *   widget to be added as the last child of the host.
   *
   * #### Notes
   * This will throw an error if the widget is not a root widget, if
   * the widget is already attached, or if the host is not attached
   * to the DOM.
   */
  export function attach(
    widget: Widget,
    host: HTMLElement,
    ref: HTMLElement | null = null
  ): void {
    if (widget.parent) {
      throw new Error('Cannot attach a child widget.');
    }
    if (widget.isAttached || widget.node.isConnected) {
      throw new Error('Widget is already attached.');
    }
    if (!host.isConnected) {
      throw new Error('Host is not attached.');
    }
    MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    host.insertBefore(widget.node, ref);
    MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
  }

  /**
   * Detach the widget from its host DOM node.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This will throw an error if the widget is not a root widget,
   * or if the widget is not attached to the DOM.
   */
  export function detach(widget: Widget): void {
    if (widget.parent) {
      throw new Error('Cannot detach a child widget.');
    }
    if (!widget.isAttached || !widget.node.isConnected) {
      throw new Error('Widget is not attached.');
    }
    MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    widget.node.parentNode!.removeChild(widget.node);
    MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
  }
}

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An attached property for the widget title object.
   */
  export const titleProperty = new AttachedProperty<Widget, Title<Widget>>({
    name: 'title',
    create: owner => new Title<Widget>({ owner })
  });

  /**
   * Create a DOM node for the given widget options.
   */
  export function createNode(options: Widget.IOptions): HTMLElement {
    return options.node || document.createElement(options.tag || 'div');
  }
}
