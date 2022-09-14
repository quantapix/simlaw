import { Operator } from "./Operator"
import { Observable } from "./Observable"
import { Subscriber } from "./Subscriber"
import { Subscription, EMPTY_SUBSCRIPTION } from "./Subscription"
import { Observer, SubscriptionLike, TeardownLogic } from "./types"
import { ObjectUnsubscribedError } from "./util/ObjectUnsubscribedError"
import { arrRemove } from "./util/arrRemove"
import { errorContext } from "./util/errorContext"

export class Subject<T> extends Observable<T> implements SubscriptionLike {
  closed = false
  private currentObservers: Observer<T>[] | null = null
  observers: Observer<T>[] = []
  isStopped = false
  hasError = false
  thrownError: any = null
  static create: (...args: any[]) => any = <T>(
    destination: Observer<T>,
    source: Observable<T>
  ): AnonymousSubject<T> => {
    return new AnonymousSubject<T>(destination, source)
  }
  constructor() {
    super()
  }
  lift<R>(operator: Operator<T, R>): Observable<R> {
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
  protected _trySubscribe(subscriber: Subscriber<T>): TeardownLogic {
    this._throwIfClosed()
    return super._trySubscribe(subscriber)
  }
  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    this._throwIfClosed()
    this._checkFinalizedStatuses(subscriber)
    return this._innerSubscribe(subscriber)
  }
  protected _innerSubscribe(subscriber: Subscriber<any>) {
    const { hasError, isStopped, observers } = this
    if (hasError || isStopped) {
      return EMPTY_SUBSCRIPTION
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
  constructor(public destination?: Observer<T>, source?: Observable<T>) {
    super()
    this.source = source
  }
  next(value: T) {
    this.destination?.next?.(value)
  }
  error(err: any) {
    this.destination?.error?.(err)
  }
  complete() {
    this.destination?.complete?.()
  }
  protected _subscribe(subscriber: Subscriber<T>): Subscription {
    return this.source?.subscribe(subscriber) ?? EMPTY_SUBSCRIPTION
  }
}
