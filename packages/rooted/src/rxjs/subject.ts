import { stampProvider } from "./scheduler.js"
import { Observable } from "./observable.js"
import { Subscription } from "./subscription.js"
import * as qu from "./utils.js"
import type { Operator } from "./operator.js"
import type { Subscriber } from "./subscriber.js"
import type * as qt from "./types.js"

export class Subject<T> extends Observable<T> implements qt.Subscription {
  closed = false
  private current: qt.Observer<T>[] | null = null
  observers: qt.Observer<T>[] = []
  stopped = false
  erred = false
  thrown: any = null
  static create: (...xs: any[]) => any = <T>(
    dest: qt.Observer<T>,
    src: Observable<T>
  ): AnonymousSubject<T> => {
    return new AnonymousSubject<T>(dest, src)
  }
  constructor() {
    super()
  }
  override lift<R>(x: Operator<T, R>): Observable<R> {
    const y = new AnonymousSubject(this, this)
    y.op = x as any
    return y as any
  }
  protected _throwIfClosed() {
    if (this.closed) throw new qu.ObjectUnsubscribedError()
  }
  next(x: T) {
    qu.errorContext(() => {
      this._throwIfClosed()
      if (!this.stopped) {
        if (!this.current) this.current = Array.from(this.observers)
        for (const o of this.current) {
          o.next(x)
        }
      }
    })
  }
  error(x: any) {
    qu.errorContext(() => {
      this._throwIfClosed()
      if (!this.stopped) {
        this.erred = this.stopped = true
        this.thrown = x
        const { observers } = this
        while (observers.length) {
          observers.shift()!.error(x)
        }
      }
    })
  }
  done() {
    qu.errorContext(() => {
      this._throwIfClosed()
      if (!this.stopped) {
        this.stopped = true
        const { observers } = this
        while (observers.length) {
          observers.shift()!.done()
        }
      }
    })
  }
  unsubscribe() {
    this.stopped = this.closed = true
    this.observers = this.current = null!
  }
  get observed() {
    return this.observers?.length > 0
  }
  protected override _try(x: Subscriber<T>): qt.Teardown {
    this._throwIfClosed()
    return super._try(x)
  }
  protected override _subscribe(x: Subscriber<T>): Subscription {
    this._throwIfClosed()
    this._checkFinalized(x)
    return this._innerSubscribe(x)
  }
  protected _innerSubscribe(x: Subscriber<any>) {
    const { erred, stopped, observers } = this
    if (erred || stopped) return Subscription.EMPTY
    this.current = null
    observers.push(x)
    return new Subscription(() => {
      this.current = null
      qu.arrRemove(observers, x)
    })
  }
  protected _checkFinalized(x: Subscriber<any>) {
    const { erred, thrown: thrown, stopped } = this
    if (erred) x.error(thrown)
    else if (stopped) x.done()
  }
  asObservable(): Observable<T> {
    const y: any = new Observable<T>()
    y.source = this
    return y
  }
}

export class AnonymousSubject<T> extends Subject<T> {
  constructor(public dest?: qt.Observer<T>, src?: Observable<T>) {
    super()
    this.src = src
  }
  override next(x: T) {
    this.dest?.next?.(x)
  }
  override error(x: any) {
    this.dest?.error?.(x)
  }
  override done() {
    this.dest?.done?.()
  }
  protected override _subscribe(x: Subscriber<T>): Subscription {
    return this.src?.subscribe(x) ?? Subscription.EMPTY
  }
}

export class AsyncSubject<T> extends Subject<T> {
  private _val: T | null = null
  private _hasVal = false
  private _isDone = false

  protected override _checkFinalized(x: Subscriber<T>) {
    const { erred, _hasVal, _val, thrown, stopped, _isDone } = this
    if (erred) x.error(thrown)
    else if (stopped || _isDone) {
      _hasVal && x.next(_val!)
      x.done()
    }
  }
  override next(x: T): void {
    if (!this.stopped) {
      this._val = x
      this._hasVal = true
    }
  }
  override done(): void {
    const { _hasVal, _val, _isDone } = this
    if (!_isDone) {
      this._isDone = true
      _hasVal && super.next(_val!)
      super.done()
    }
  }
}

export class BehaviorSubject<T> extends Subject<T> {
  constructor(private _val: T) {
    super()
  }
  get value(): T {
    return this.getValue()
  }
  protected override _subscribe(x: Subscriber<T>): Subscription {
    const y = super._subscribe(x)
    !y.closed && x.next(this._val)
    return y
  }
  getValue(): T {
    const { erred, thrown: thrown, _val } = this
    if (erred) throw thrown
    this._throwIfClosed()
    return _val
  }
  override next(x: T): void {
    super.next((this._val = x))
  }
}

export class ReplaySubject<T> extends Subject<T> {
  private _buffer: (T | number)[] = []
  private _infiniteTimeWindow = true
  constructor(
    private _bufferSize = Infinity,
    private _windowTime = Infinity,
    private _timestampProvider: qt.TimestampProvider = stampProvider
  ) {
    super()
    this._infiniteTimeWindow = _windowTime === Infinity
    this._bufferSize = Math.max(1, _bufferSize)
    this._windowTime = Math.max(1, _windowTime)
  }
  override next(x: T): void {
    const {
      stopped,
      _buffer,
      _infiniteTimeWindow,
      _timestampProvider,
      _windowTime,
    } = this
    if (!stopped) {
      _buffer.push(x)
      !_infiniteTimeWindow &&
        _buffer.push(_timestampProvider.now() + _windowTime)
    }
    this._trimBuffer()
    super.next(x)
  }
  protected override _subscribe(x: Subscriber<T>): Subscription {
    this._throwIfClosed()
    this._trimBuffer()
    const y = this._innerSubscribe(x)
    const { _infiniteTimeWindow, _buffer } = this
    const copy = _buffer.slice()
    for (
      let i = 0;
      i < copy.length && !x.closed;
      i += _infiniteTimeWindow ? 1 : 2
    ) {
      x.next(copy[i] as T)
    }
    this._checkFinalized(x)
    return y
  }

  private _trimBuffer() {
    const { _bufferSize, _timestampProvider, _buffer, _infiniteTimeWindow } =
      this
    const adjustedBufferSize = (_infiniteTimeWindow ? 1 : 2) * _bufferSize
    _bufferSize < Infinity &&
      adjustedBufferSize < _buffer.length &&
      _buffer.splice(0, _buffer.length - adjustedBufferSize)
    if (!_infiniteTimeWindow) {
      const now = _timestampProvider.now()
      let last = 0
      for (
        let i = 1;
        i < _buffer.length && (_buffer[i] as number) <= now;
        i += 2
      ) {
        last = i
      }
      last && _buffer.splice(0, last + 1)
    }
  }
}
