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
  isStopped = false
  hasError = false
  thrownError: any = null
  static override create: (...xs: any[]) => any = <T>(
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
      if (!this.isStopped) {
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
      if (!this.isStopped) {
        this.hasError = this.isStopped = true
        this.thrownError = x
        const { observers } = this
        while (observers.length) {
          observers.shift()!.error(x)
        }
      }
    })
  }
  complete() {
    qu.errorContext(() => {
      this._throwIfClosed()
      if (!this.isStopped) {
        this.isStopped = true
        const { observers } = this
        while (observers.length) {
          observers.shift()!.complete()
        }
      }
    })
  }
  unsubscribe() {
    this.isStopped = this.closed = true
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
    this._checkFinalizedStatuses(x)
    return this._innerSubscribe(x)
  }
  protected _innerSubscribe(x: Subscriber<any>) {
    const { hasError, isStopped, observers } = this
    if (hasError || isStopped) return Subscription.EMPTY
    this.current = null
    observers.push(x)
    return new Subscription(() => {
      this.current = null
      qu.arrRemove(observers, x)
    })
  }
  protected _checkFinalizedStatuses(x: Subscriber<any>) {
    const { hasError, thrownError, isStopped } = this
    if (hasError) x.error(thrownError)
    else if (isStopped) x.complete()
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
  override next(value: T) {
    this.dest?.next?.(value)
  }
  override error(err: any) {
    this.dest?.error?.(err)
  }
  override complete() {
    this.dest?.complete?.()
  }
  protected override _subscribe(x: Subscriber<T>): Subscription {
    return this.src?.subscribe(x) ?? Subscription.EMPTY
  }
}

export class AsyncSubject<T> extends Subject<T> {
  private _value: T | null = null
  private _hasValue = false
  private _isComplete = false

  protected override _checkFinalizedStatuses(x: Subscriber<T>) {
    const { hasError, _hasValue, _value, thrownError, isStopped, _isComplete } =
      this
    if (hasError) x.error(thrownError)
    else if (isStopped || _isComplete) {
      _hasValue && x.next(_value!)
      x.complete()
    }
  }
  override next(x: T): void {
    if (!this.isStopped) {
      this._value = x
      this._hasValue = true
    }
  }
  override complete(): void {
    const { _hasValue, _value, _isComplete } = this
    if (!_isComplete) {
      this._isComplete = true
      _hasValue && super.next(_value!)
      super.complete()
    }
  }
}

export class BehaviorSubject<T> extends Subject<T> {
  constructor(private _value: T) {
    super()
  }
  get value(): T {
    return this.getValue()
  }
  protected override _subscribe(x: Subscriber<T>): Subscription {
    const y = super._subscribe(x)
    !y.closed && x.next(this._value)
    return y
  }
  getValue(): T {
    const { hasError, thrownError, _value } = this
    if (hasError) throw thrownError
    this._throwIfClosed()
    return _value
  }
  override next(x: T): void {
    super.next((this._value = x))
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
      isStopped,
      _buffer,
      _infiniteTimeWindow,
      _timestampProvider,
      _windowTime,
    } = this
    if (!isStopped) {
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
    const subscription = this._innerSubscribe(x)
    const { _infiniteTimeWindow, _buffer } = this
    const copy = _buffer.slice()
    for (
      let i = 0;
      i < copy.length && !x.closed;
      i += _infiniteTimeWindow ? 1 : 2
    ) {
      x.next(copy[i] as T)
    }
    this._checkFinalizedStatuses(x)
    return subscription
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
