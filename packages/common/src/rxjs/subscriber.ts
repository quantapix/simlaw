import { isSubscription, Subscription } from "./subscription.js"
import { nextNote, errNote, DONE_NOTE } from "./note.js"
import { timeoutProvider } from "./scheduler.js"
import * as qu from "./utils.js"
import type * as qt from "./types.js"

export class Subscriber<T> extends Subscription implements qt.Observer<T> {
  static create<T>(next?: (x: T) => void, error?: (x: any) => void, done?: () => void): Subscriber<T> {
    return new SafeSubscriber(next, error, done)
  }
  protected stopped = false
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
      this.stopped = true
      super.unsubscribe()
      this.dest = null!
    }
  }
  next(x: T) {
    if (this.stopped) doStopped(nextNote(x), this)
    else this._next(x)
  }
  error(x: any) {
    if (this.stopped) doStopped(errNote(x), this)
    else {
      this.stopped = true
      this._error(x)
    }
  }
  done() {
    if (this.stopped) doStopped(DONE_NOTE, this)
    else {
      this.stopped = true
      this._done()
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
  protected _done() {
    try {
      this.dest.done()
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
  constructor(private obs: qt.PartialObserver<T>) {}
  next(x: T) {
    const { obs } = this
    if (obs.next) {
      try {
        obs.next(x)
      } catch (e) {
        doUnhandled(e)
      }
    }
  }
  error(x: any) {
    const { obs } = this
    if (obs.error) {
      try {
        obs.error(x)
      } catch (e) {
        doUnhandled(e)
      }
    } else doUnhandled(x)
  }
  done() {
    const { obs } = this
    if (obs.done) {
      try {
        obs.done()
      } catch (error) {
        doUnhandled(error)
      }
    }
  }
}

export function isSubscriber<T>(x: any): x is Subscriber<T> {
  return (x && x instanceof Subscriber) || (qu.isObserver(x) && isSubscription(x))
}

export class SafeSubscriber<T> extends Subscriber<T> {
  constructor(
    x?: qt.PartialObserver<T> | ((x: T) => void) | null,
    error?: ((x?: any) => void) | null,
    done?: (() => void) | null
  ) {
    super()
    let y: qt.PartialObserver<T>
    if (qu.isFunction(x) || !x) {
      y = {
        next: x,
        error: error ?? undefined,
        done: done ?? undefined,
      } as qt.NextObserver<T>
    } else {
      let ctx: any
      if (this && qu.config.useDeprecatedNextContext) {
        ctx = Object.create(x)
        ctx.unsubscribe = () => this.unsubscribe()
        y = {
          next: x.next && bind(x.next, ctx),
          error: x.error && bind(x.error, ctx),
          done: x.done && bind(x.done, ctx),
        } as qt.PartialObserver<T>
      } else y = x
    }
    this.dest = new ConsumerObserver(y)
  }
}

function doStopped(x: qt.ObsNote<any>, s: Subscriber<any>) {
  const { onStoppedNote } = qu.config
  onStoppedNote && timeoutProvider.setTimeout(() => onStoppedNote(x, s))
}

function doUnhandled(x: any) {
  if (qu.config.useDeprecatedSynchronousErrorHandling) {
    qu.captureError(x)
  } else {
    qu.reportUnhandledError(x)
  }
}

function doError(x: any) {
  throw x
}

const EMPTY_OBS: Readonly<qt.Observer<any>> & { closed: true } = {
  closed: true,
  next: qu.noop,
  error: doError,
  done: qu.noop,
}
