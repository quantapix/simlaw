import { isSubscription, Subscription } from "./subscription.js"
import { nextNote, errorNote, COMPLETE_NOTE } from "./note.js"
import { timeoutProvider } from "./scheduler.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Subscriber<T> extends Subscription implements qt.Observer<T> {
  static create<T>(
    next?: (x?: T) => void,
    error?: (e?: any) => void,
    complete?: () => void
  ): Subscriber<T> {
    return new SafeSubscriber(next, error, complete)
  }
  protected isStopped = false
  protected dest: Subscriber<any> | qt.Observer<any>
  constructor(x?: Subscriber<any> | qt.Observer<any>) {
    super()
    if (x) {
      this.dest = x
      if (isSubscription(x)) x.add(this)
    } else this.dest = EMPTY_OBS
  }
  override unsubscribe(): void {
    if (!this.closed) {
      this.isStopped = true
      super.unsubscribe()
      this.dest = null!
    }
  }
  next(x?: T) {
    if (this.isStopped) handleStopped(nextNote(x), this)
    else this._next(x!)
  }
  error(x?: any) {
    if (this.isStopped) handleStopped(errorNote(x), this)
    else {
      this.isStopped = true
      this._error(x)
    }
  }
  complete() {
    if (this.isStopped) handleStopped(COMPLETE_NOTE, this)
    else {
      this.isStopped = true
      this._complete()
    }
  }
  protected _next(x: T) {
    this.dest.next(x)
  }
  protected _error(x: any) {
    try {
      this.dest.error(x)
    } finally {
      this.unsubscribe()
    }
  }
  protected _complete() {
    try {
      this.dest.complete()
    } finally {
      this.unsubscribe()
    }
  }
}

const _bind = Function.prototype.bind
function bind<F extends (...xs: any[]) => any>(f: F, thisArg: any): F {
  return _bind.call(f, thisArg)
}

class ConsumerObserver<T> implements qt.Observer<T> {
  constructor(private obs: Partial<qt.Observer<T>>) {}
  next(x: T): void {
    const { obs } = this
    if (obs.next) {
      try {
        obs.next(x)
      } catch (e) {
        handleUnhandled(e)
      }
    }
  }
  error(x: any): void {
    const { obs } = this
    if (obs.error) {
      try {
        obs.error(x)
      } catch (e) {
        handleUnhandled(e)
      }
    } else handleUnhandled(x)
  }
  complete(): void {
    const { obs } = this
    if (obs.complete) {
      try {
        obs.complete()
      } catch (error) {
        handleUnhandled(error)
      }
    }
  }
}

export function isSubscriber<T>(x: any): x is Subscriber<T> {
  return (
    (x && x instanceof Subscriber) || (qu.isObserver(x) && isSubscription(x))
  )
}

export class SafeSubscriber<T> extends Subscriber<T> {
  constructor(
    next?: Partial<qt.Observer<T>> | ((x: T) => void) | null,
    error?: ((x?: any) => void) | null,
    complete?: (() => void) | null
  ) {
    super()
    let obs: Partial<qt.Observer<T>>
    if (qu.isFunction(next) || !next) {
      obs = {
        next: (next ?? undefined) as ((x: T) => void) | undefined,
        error: error ?? undefined,
        complete: complete ?? undefined,
      }
    } else {
      let ctx: any
      if (this && qu.config.useDeprecatedNextContext) {
        ctx = Object.create(next)
        ctx.unsubscribe = () => this.unsubscribe()
        obs = {
          next: next.next && bind(next.next, ctx),
          error: next.error && bind(next.error, ctx),
          complete: next.complete && bind(next.complete, ctx),
        }
      } else obs = next
    }
    this.dest = new ConsumerObserver(obs)
  }
}

function defaultHandler(x: any) {
  throw x
}

function handleStopped(x: qt.ObservableNote<any>, sub: Subscriber<any>) {
  const { onStoppedNote } = qu.config
  onStoppedNote && timeoutProvider.setTimeout(() => onStoppedNote(x, sub))
}

function handleUnhandled(x: any) {
  if (qu.config.useDeprecatedSynchronousErrorHandling) {
    qu.captureError(x)
  } else {
    qu.reportUnhandledError(x)
  }
}

const EMPTY_OBS: Readonly<qt.Observer<any>> & { closed: true } = {
  closed: true,
  next: qu.noop,
  error: defaultHandler,
  complete: qu.noop,
}