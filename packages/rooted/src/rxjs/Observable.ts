import { Operator } from "./Operator"
import { SafeSubscriber, Subscriber } from "./Subscriber"
import { isSubscription, Subscription } from "./Subscription"
import {
  TeardownLogic,
  OperatorFunction,
  Subscribable,
  Observer,
} from "./types"
import { observable as Symbol_observable } from "./symbol/observable"
import { pipeFromArray } from "./util/pipe"
import { config } from "./config"
import { isFunction } from "./util/isFunction"
import { errorContext } from "./util/errorContext"

export class Observable<T> implements Subscribable<T> {
  source: Observable<any> | undefined
  operator: Operator<any, T> | undefined
  constructor(
    subscribe?: (
      this: Observable<T>,
      subscriber: Subscriber<T>
    ) => TeardownLogic
  ) {
    if (subscribe) {
      this._subscribe = subscribe
    }
  }
  static create: (...args: any[]) => any = <T>(
    subscribe?: (subscriber: Subscriber<T>) => TeardownLogic
  ) => {
    return new Observable<T>(subscribe)
  }
  lift<R>(operator?: Operator<T, R>): Observable<R> {
    const observable = new Observable<R>()
    observable.source = this
    observable.operator = operator
    return observable
  }
  subscribe(observer?: Partial<Observer<T>>): Subscription
  subscribe(next: (value: T) => void): Subscription
  subscribe(
    next?: ((value: T) => void) | null,
    error?: ((error: any) => void) | null,
    complete?: (() => void) | null
  ): Subscription
  subscribe(
    observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null,
    error?: ((error: any) => void) | null,
    complete?: (() => void) | null
  ): Subscription {
    const subscriber = isSubscriber(observerOrNext)
      ? observerOrNext
      : new SafeSubscriber(observerOrNext, error, complete)
    errorContext(() => {
      const { operator, source } = this
      subscriber.add(
        operator
          ? operator.call(subscriber, source)
          : source
          ? this._subscribe(subscriber)
          : this._trySubscribe(subscriber)
      )
    })
    return subscriber
  }
  protected _trySubscribe(sink: Subscriber<T>): TeardownLogic {
    try {
      return this._subscribe(sink)
    } catch (err) {
      sink.error(err)
    }
  }
  forEach(next: (value: T) => void): Promise<void>
  forEach(
    next: (value: T) => void,
    promiseCtor: PromiseConstructorLike
  ): Promise<void>
  forEach(
    next: (value: T) => void,
    promiseCtor?: PromiseConstructorLike
  ): Promise<void> {
    promiseCtor = getPromiseCtor(promiseCtor)
    return new promiseCtor<void>((resolve, reject) => {
      const subscriber = new SafeSubscriber<T>({
        next: value => {
          try {
            next(value)
          } catch (err) {
            reject(err)
            subscriber.unsubscribe()
          }
        },
        error: reject,
        complete: resolve,
      })
      this.subscribe(subscriber)
    }) as Promise<void>
  }
  protected _subscribe(subscriber: Subscriber<any>): TeardownLogic {
    return this.source?.subscribe(subscriber)
  }
  [Symbol_observable]() {
    return this
  }
  pipe(): Observable<T>
  pipe<A>(op1: OperatorFunction<T, A>): Observable<A>
  pipe<A, B>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>
  ): Observable<B>
  pipe<A, B, C>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>
  ): Observable<C>
  pipe<A, B, C, D>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>
  ): Observable<D>
  pipe<A, B, C, D, E>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>
  ): Observable<E>
  pipe<A, B, C, D, E, F>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>
  ): Observable<F>
  pipe<A, B, C, D, E, F, G>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>
  ): Observable<G>
  pipe<A, B, C, D, E, F, G, H>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>
  ): Observable<H>
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
    op9: OperatorFunction<H, I>
  ): Observable<I>
  pipe<A, B, C, D, E, F, G, H, I>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>,
    op7: OperatorFunction<F, G>,
    op8: OperatorFunction<G, H>,
    op9: OperatorFunction<H, I>,
    ...operations: OperatorFunction<any, any>[]
  ): Observable<unknown>
  pipe(...operations: OperatorFunction<any, any>[]): Observable<any> {
    return pipeFromArray(operations)(this)
  }
  toPromise(): Promise<T | undefined>
  toPromise(PromiseCtor: typeof Promise): Promise<T | undefined>
  toPromise(PromiseCtor: PromiseConstructorLike): Promise<T | undefined>
  toPromise(promiseCtor?: PromiseConstructorLike): Promise<T | undefined> {
    promiseCtor = getPromiseCtor(promiseCtor)
    return new promiseCtor((resolve, reject) => {
      let value: T | undefined
      this.subscribe(
        (x: T) => (value = x),
        (err: any) => reject(err),
        () => resolve(value)
      )
    }) as Promise<T | undefined>
  }
}
function getPromiseCtor(promiseCtor: PromiseConstructorLike | undefined) {
  return promiseCtor ?? config.Promise ?? Promise
}
function isObserver<T>(value: any): value is Observer<T> {
  return (
    value &&
    isFunction(value.next) &&
    isFunction(value.error) &&
    isFunction(value.complete)
  )
}
function isSubscriber<T>(value: any): value is Subscriber<T> {
  return (
    (value && value instanceof Subscriber) ||
    (isObserver(value) && isSubscription(value))
  )
}
