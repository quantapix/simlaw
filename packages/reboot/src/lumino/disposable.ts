/* eslint-disable @typescript-eslint/no-namespace */
import { ISignal, Signal } from "./signaling.js"
export interface IDisposable {
  readonly isDisposed: boolean
  dispose(): void
}
export interface IObservableDisposable extends IDisposable {
  readonly disposed: ISignal<this, void>
}
export class DisposableDelegate implements IDisposable {
  constructor(fn: () => void) {
    this._fn = fn
  }
  get isDisposed(): boolean {
    return !this._fn
  }
  dispose(): void {
    if (!this._fn) {
      return
    }
    let fn = this._fn
    this._fn = null
    fn()
  }
  private _fn: (() => void) | null
}
export class ObservableDisposableDelegate
  extends DisposableDelegate
  implements IObservableDisposable
{
  get disposed(): ISignal<this, void> {
    return this._disposed
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    super.dispose()
    this._disposed.emit(undefined)
    Signal.clearData(this)
  }
  private _disposed = new Signal<this, void>(this)
}
export class DisposableSet implements IDisposable {
  get isDisposed(): boolean {
    return this._isDisposed
  }
  dispose(): void {
    if (this._isDisposed) {
      return
    }
    this._isDisposed = true
    this._items.forEach(item => {
      item.dispose()
    })
    this._items.clear()
  }
  contains(item: IDisposable): boolean {
    return this._items.has(item)
  }
  add(item: IDisposable): void {
    this._items.add(item)
  }
  remove(item: IDisposable): void {
    this._items.delete(item)
  }
  clear(): void {
    this._items.clear()
  }
  private _isDisposed = false
  private _items = new Set<IDisposable>()
}
export namespace DisposableSet {
  export function from(items: Iterable<IDisposable>): DisposableSet {
    let set = new DisposableSet()
    for (const item of items) {
      set.add(item)
    }
    return set
  }
}
export class ObservableDisposableSet
  extends DisposableSet
  implements IObservableDisposable
{
  get disposed(): ISignal<this, void> {
    return this._disposed
  }
  dispose(): void {
    if (this.isDisposed) {
      return
    }
    super.dispose()
    this._disposed.emit(undefined)
    Signal.clearData(this)
  }
  private _disposed = new Signal<this, void>(this)
}
export namespace ObservableDisposableSet {
  export function from(items: Iterable<IDisposable>): ObservableDisposableSet {
    let set = new ObservableDisposableSet()
    for (const item of items) {
      set.add(item)
    }
    return set
  }
}
