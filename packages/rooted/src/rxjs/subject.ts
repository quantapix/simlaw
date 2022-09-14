import { Operator } from "./Operator"
import { Observable } from "./Observable.js"
import { Subscription } from "./subscription.js"
import type * as qt from "./types.js"
import { arrRemove, errorContext, ObjectUnsubscribedError } from "./utils.js"
import type { Subscriber } from "./subscriber.js"
import { dateTimestampProvider } from "./scheduler.js"

export class Subject<T> extends Observable<T> implements qt.Subscription {
  closed = false
  private currentObservers: qt.Observer<T>[] | null = null
  observers: qt.Observer<T>[] = []
  isStopped = false
  hasError = false
  thrownError: any = null
  static override create: (...args: any[]) => any = <T>(
    destination: qt.Observer<T>,
    source: Observable<T>
  ): AnonymousSubject<T> => {
    return new AnonymousSubject<T>(destination, source)
  }
  constructor() {
    super()
  }
  override lift<R>(operator: Operator<T, R>): Observable<R> {
    const subject = new AnonymousSubject(this, this)
    subject.operator = operator as any
    return subject as any
  }
  protected _throwIfClosed() {
    if (this.closed) {
      throw new ObjectUnsubscribedError()
    }
  }
  next(value: T) {
    errorContext(() => {
      this._throwIfClosed()
      if (!this.isStopped) {
        if (!this.currentObservers) {
          this.currentObservers = Array.from(this.observers)
        }
        for (const observer of this.currentObservers) {
          observer.next(value)
        }
      }
    })
  }
  error(err: any) {
    errorContext(() => {
      this._throwIfClosed()
      if (!this.isStopped) {
        this.hasError = this.isStopped = true
        this.thrownError = err
        const { observers } = this
        while (observers.length) {
          observers.shift()!.error(err)
        }
      }
    })
  }
  complete() {
    errorContext(() => {
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
    this.observers = this.currentObservers = null!
  }
  get observed() {
    return this.observers?.length > 0
  }
  protected override _trySubscribe(subscriber: Subscriber<T>): qt.Teardown {
    this._throwIfClosed()
    return super._trySubscribe(subscriber)
  }
  protected override _subscribe(subscriber: Subscriber<T>): Subscription {
    this._throwIfClosed()
    this._checkFinalizedStatuses(subscriber)
    return this._innerSubscribe(subscriber)
  }
  protected _innerSubscribe(subscriber: Subscriber<any>) {
    const { hasError, isStopped, observers } = this
    if (hasError || isStopped) {
      return Subscription.EMPTY
    }
    this.currentObservers = null
    observers.push(subscriber)
    return new Subscription(() => {
      this.currentObservers = null
      arrRemove(observers, subscriber)
    })
  }
  protected _checkFinalizedStatuses(subscriber: Subscriber<any>) {
    const { hasError, thrownError, isStopped } = this
    if (hasError) {
      subscriber.error(thrownError)
    } else if (isStopped) {
      subscriber.complete()
    }
  }
  asObservable(): Observable<T> {
    const observable: any = new Observable<T>()
    observable.source = this
    return observable
  }
}

export class AnonymousSubject<T> extends Subject<T> {
  constructor(public destination?: qt.Observer<T>, source?: Observable<T>) {
    super()
    this.source = source
  }
  override next(value: T) {
    this.destination?.next?.(value)
  }
  override error(err: any) {
    this.destination?.error?.(err)
  }
  override complete() {
    this.destination?.complete?.()
  }
  protected override _subscribe(subscriber: Subscriber<T>): Subscription {
    return this.source?.subscribe(subscriber) ?? Subscription.EMPTY
  }
}

export class AsyncSubject<T> extends Subject<T> {
  private _value: T | null = null
  private _hasValue = false
  private _isComplete = false

  protected override _checkFinalizedStatuses(subscriber: Subscriber<T>) {
    const { hasError, _hasValue, _value, thrownError, isStopped, _isComplete } =
      this
    if (hasError) {
      subscriber.error(thrownError)
    } else if (isStopped || _isComplete) {
      _hasValue && subscriber.next(_value!)
      subscriber.complete()
    }
  }
  override next(value: T): void {
    if (!this.isStopped) {
      this._value = value
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
  protected override _subscribe(subscriber: Subscriber<T>): Subscription {
    const subscription = super._subscribe(subscriber)
    !subscription.closed && subscriber.next(this._value)
    return subscription
  }
  getValue(): T {
    const { hasError, thrownError, _value } = this
    if (hasError) {
      throw thrownError
    }
    this._throwIfClosed()
    return _value
  }
  override next(value: T): void {
    super.next((this._value = value))
  }
}

export class ReplaySubject<T> extends Subject<T> {
  private _buffer: (T | number)[] = []
  private _infiniteTimeWindow = true
  constructor(
    private _bufferSize = Infinity,
    private _windowTime = Infinity,
    private _timestampProvider: qt.TimestampProvider = dateTimestampProvider
  ) {
    super()
    this._infiniteTimeWindow = _windowTime === Infinity
    this._bufferSize = Math.max(1, _bufferSize)
    this._windowTime = Math.max(1, _windowTime)
  }
  override next(value: T): void {
    const {
      isStopped,
      _buffer,
      _infiniteTimeWindow,
      _timestampProvider,
      _windowTime,
    } = this
    if (!isStopped) {
      _buffer.push(value)
      !_infiniteTimeWindow &&
        _buffer.push(_timestampProvider.now() + _windowTime)
    }
    this._trimBuffer()
    super.next(value)
  }
  protected override _subscribe(subscriber: Subscriber<T>): Subscription {
    this._throwIfClosed()
    this._trimBuffer()
    const subscription = this._innerSubscribe(subscriber)
    const { _infiniteTimeWindow, _buffer } = this
    const copy = _buffer.slice()
    for (
      let i = 0;
      i < copy.length && !subscriber.closed;
      i += _infiniteTimeWindow ? 1 : 2
    ) {
      subscriber.next(copy[i] as T)
    }
    this._checkFinalizedStatuses(subscriber)
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
