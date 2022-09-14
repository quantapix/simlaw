import { isFunction } from "./util/isFunction"
import { Observer, ObservableNotification } from "./types"
import { isSubscription, Subscription } from "./subscription.js"
import { config } from "./config"
import { reportUnhandledError } from "./util/reportUnhandledError"
import { noop } from "./util/noop"
import {
  nextNotification,
  errorNotification,
  COMPLETE_NOTIFICATION,
} from "./aaa/notification.js"
import { timeoutProvider } from "./scheduler/timeoutProvider"
import { captureError } from "./util/errorContext"
import { Subscriber } from "./subscriber.js"
import { TeardownLogic } from "./types"

export class Subscriber<T> extends Subscription implements Observer<T> {
  static create<T>(
    next?: (x?: T) => void,
    error?: (e?: any) => void,
    complete?: () => void
  ): Subscriber<T> {
    return new SafeSubscriber(next, error, complete)
  }
  protected isStopped: boolean = false
  protected destination: Subscriber<any> | Observer<any>
  constructor(destination?: Subscriber<any> | Observer<any>) {
    super()
    if (destination) {
      this.destination = destination

      if (isSubscription(destination)) {
        destination.add(this)
      }
    } else {
      this.destination = EMPTY_OBSERVER
    }
  }
  next(value?: T): void {
    if (this.isStopped) {
      handleStoppedNotification(nextNotification(value), this)
    } else {
      this._next(value!)
    }
  }
  error(err?: any): void {
    if (this.isStopped) {
      handleStoppedNotification(errorNotification(err), this)
    } else {
      this.isStopped = true
      this._error(err)
    }
  }
  complete(): void {
    if (this.isStopped) {
      handleStoppedNotification(COMPLETE_NOTIFICATION, this)
    } else {
      this.isStopped = true
      this._complete()
    }
  }
  unsubscribe(): void {
    if (!this.closed) {
      this.isStopped = true
      super.unsubscribe()
      this.destination = null!
    }
  }
  protected _next(value: T): void {
    this.destination.next(value)
  }
  protected _error(err: any): void {
    try {
      this.destination.error(err)
    } finally {
      this.unsubscribe()
    }
  }
  protected _complete(): void {
    try {
      this.destination.complete()
    } finally {
      this.unsubscribe()
    }
  }
}
const _bind = Function.prototype.bind
function bind<Fn extends (...args: any[]) => any>(fn: Fn, thisArg: any): Fn {
  return _bind.call(fn, thisArg)
}

class ConsumerObserver<T> implements Observer<T> {
  constructor(private partialObserver: Partial<Observer<T>>) {}
  next(value: T): void {
    const { partialObserver } = this
    if (partialObserver.next) {
      try {
        partialObserver.next(value)
      } catch (error) {
        handleUnhandledError(error)
      }
    }
  }
  error(err: any): void {
    const { partialObserver } = this
    if (partialObserver.error) {
      try {
        partialObserver.error(err)
      } catch (error) {
        handleUnhandledError(error)
      }
    } else {
      handleUnhandledError(err)
    }
  }
  complete(): void {
    const { partialObserver } = this
    if (partialObserver.complete) {
      try {
        partialObserver.complete()
      } catch (error) {
        handleUnhandledError(error)
      }
    }
  }
}

export class SafeSubscriber<T> extends Subscriber<T> {
  constructor(
    observerOrNext?: Partial<Observer<T>> | ((value: T) => void) | null,
    error?: ((e?: any) => void) | null,
    complete?: (() => void) | null
  ) {
    super()
    let partialObserver: Partial<Observer<T>>
    if (isFunction(observerOrNext) || !observerOrNext) {
      partialObserver = {
        next: (observerOrNext ?? undefined) as ((value: T) => void) | undefined,
        error: error ?? undefined,
        complete: complete ?? undefined,
      }
    } else {
      let context: any
      if (this && config.useDeprecatedNextContext) {
        context = Object.create(observerOrNext)
        context.unsubscribe = () => this.unsubscribe()
        partialObserver = {
          next: observerOrNext.next && bind(observerOrNext.next, context),
          error: observerOrNext.error && bind(observerOrNext.error, context),
          complete:
            observerOrNext.complete && bind(observerOrNext.complete, context),
        }
      } else {
        partialObserver = observerOrNext
      }
    }

    this.destination = new ConsumerObserver(partialObserver)
  }
}
function handleUnhandledError(error: any) {
  if (config.useDeprecatedSynchronousErrorHandling) {
    captureError(error)
  } else {
    reportUnhandledError(error)
  }
}
function defaultErrorHandler(err: any) {
  throw err
}
function handleStoppedNotification(
  notification: ObservableNotification<any>,
  subscriber: Subscriber<any>
) {
  const { onStoppedNotification } = config
  onStoppedNotification &&
    timeoutProvider.setTimeout(() =>
      onStoppedNotification(notification, subscriber)
    )
}
export const EMPTY_OBSERVER: Readonly<Observer<any>> & { closed: true } = {
  closed: true,
  next: noop,
  error: defaultErrorHandler,
  complete: noop,
}

export interface Operator<T, R> {
  call(subscriber: Subscriber<R>, source: any): TeardownLogic
}
